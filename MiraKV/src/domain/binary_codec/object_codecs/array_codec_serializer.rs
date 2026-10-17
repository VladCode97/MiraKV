//! Serializes and deserializes homogeneous primitive arrays.
//!
//! Arrays are homogeneous by type: the `PrimitiveValues` enum guarantees at
//! the type level that every element shares one primitive type (string,
//! number, boolean, or date). The payload layout is:
//!
//! ```text
//! [element_type:1][count:4]  then per element: [length:4][payload:length]
//! ```
//!
//! The shared element type is written once in the header rather than per
//! element. Each element is delegated to its matching primitive codec.

use crate::domain::binary_codec::primitive_codecs::boolean_codec_serializer::BooleanCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::date_codec_serializer::DateCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::number_codec_serializer::NumberCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::string_codec_serializer::StringCodecSerializer;
use crate::domain::constants::binary_types::BinaryType;
use crate::domain::traits::serializer::Serializer;
use crate::domain::types::parser::{PrimitiveValues, Value};

/// Codec for homogeneous primitive arrays (`Value::Array`).
pub struct ArrayCodecSerializer;

impl ArrayCodecSerializer {
    /// Appends one length-prefixed element to `result`.
    ///
    /// Writes the element's byte length as a little-endian `u32`, followed by
    /// the element bytes themselves.
    ///
    /// # Panics
    /// If the element is larger than `u32::MAX` bytes.
    fn append_serialized_element(result: &mut Vec<u8>, bytes: &[u8]) {
        let length = u32::try_from(bytes.len())
            .expect("Element payload exceeds the maximum length supported by u32");
        result.extend_from_slice(&length.to_le_bytes());
        result.extend_from_slice(bytes);
    }

    /// Appends the array header to `result`: the shared element type (1 byte)
    /// followed by the element count as a little-endian `u32`.
    ///
    /// # Panics
    /// If the array has more than `u32::MAX` elements.
    fn append_array_header(result: &mut Vec<u8>, count: usize, type_: BinaryType) {
        let type_value = type_ as u8;
        let count =
            u32::try_from(count).expect("Array contains more elements than u32 can represent");
        result.push(type_value);
        result.extend_from_slice(&count.to_le_bytes());
    }

    /// Walks every length-prefixed element in the payload and decodes it.
    ///
    /// This is the shared read loop for all element types: it handles the
    /// `offset` cursor, every length/bounds validation, and the trailing-byte
    /// check. Only the per-element `decode` closure varies between types —
    /// it turns one element payload into the concrete value `T` (an `f64`,
    /// `String`, `bool`, …), so the loop itself is written once.
    ///
    /// Element reading starts after the 5-byte header.
    ///
    /// # Arguments
    /// * `record` - The full array payload, including the header.
    /// * `count`  - Number of elements declared in the header.
    /// * `decode` - Turns a single element payload into a `T`.
    ///
    /// # Returns
    /// The decoded elements, or `Err(String)` if the payload is malformed or
    /// has trailing bytes.
    fn read_elements<T>(
        record: &[u8],
        count: u32,
        decode: impl Fn(&[u8]) -> Result<T, String>,
    ) -> Result<Vec<T>, String> {
        let mut offset: usize = 5;
        let mut values: Vec<T> = Vec::with_capacity(count as usize);

        for _ in 0..count {
            if record.len() - offset < 4 {
                return Err("Incomplete element length".to_string());
            }
            let length = u32::from_le_bytes(
                record[offset..offset + 4]
                    .try_into()
                    .map_err(|_| "Invalid element length".to_string())?,
            ) as usize;

            let element_start = offset + 4;
            if length > record.len() - element_start {
                return Err("Incomplete element payload".to_string());
            }
            let element_end = element_start + length;
            let payload = &record[element_start..element_end];
            offset = element_end;

            values.push(decode(payload)?);
        }

        if offset != record.len() {
            return Err("Unexpected trailing bytes".to_string());
        }
        Ok(values)
    }
}

impl Serializer for ArrayCodecSerializer {
    /// Serializes a homogeneous primitive array into the MiraKV array payload.
    ///
    /// Writes the header once, then delegates each element to its primitive
    /// codec and appends it length-prefixed. The matched `PrimitiveValues`
    /// variant determines both the element type in the header and which codec
    /// is used.
    ///
    /// # Arguments
    /// * `record` - The value to serialize (expected to hold an `Array`).
    ///
    /// # Returns
    /// The array header followed by every length-prefixed element.
    fn serialize(&self, record: &Value) -> Vec<u8> {
        match record {
            Value::Array(array) => {
                match array {
                    PrimitiveValues::String(strings) => {
                        let codec = StringCodecSerializer;
                        let mut result = Vec::new();
                        //Header
                        Self::append_array_header(&mut result, strings.len(), BinaryType::String);
                        for value in strings {
                            let value = Value::String(value.clone());
                            let bytes = codec.serialize(&value);
                            Self::append_serialized_element(&mut result, &bytes);
                        }
                        result
                    }
                    PrimitiveValues::Number(numbers) => {
                        let codec = NumberCodecSerializer;
                        let mut result = Vec::new();
                        Self::append_array_header(&mut result, numbers.len(), BinaryType::Number);
                        for value in numbers {
                            let value = Value::Number(*value);
                            let bytes = codec.serialize(&value);
                            Self::append_serialized_element(&mut result, &bytes);
                        }
                        result
                    }
                    PrimitiveValues::Boolean(booleans) => {
                        let codec = BooleanCodecSerializer;
                        let mut result = Vec::new();
                        Self::append_array_header(&mut result, booleans.len(), BinaryType::Boolean);
                        for value in booleans {
                            let value = Value::Boolean(*value);
                            let bytes = codec.serialize(&value);
                            Self::append_serialized_element(&mut result, &bytes);
                        }
                        result
                    }
                    PrimitiveValues::Date(dates) => {
                        let codec = DateCodecSerializer;
                        let mut result = Vec::new();
                        Self::append_array_header(&mut result, dates.len(), BinaryType::Date);
                        for date in dates {
                            let bytes = codec.serialize(&Value::Date(date.clone()));
                            Self::append_serialized_element(&mut result, &bytes);
                        }
                        result
                    }
                }
            }
            _ => panic!("Error processing an array"),
        }
    }

    /// Deserializes an array payload back into a `Value::Array`.
    ///
    /// Reads the shared element type and count from the header, then delegates
    /// the per-element read loop to [`Self::read_elements`]. Each arm supplies
    /// only what varies for its type: the primitive codec, the `Value` variant
    /// to extract, and the `PrimitiveValues` variant to build.
    ///
    /// # Arguments
    /// * `record` - Buffer containing a serialized array payload.
    ///
    /// # Returns
    /// `Ok(Value::Array)` with the decoded elements, or `Err(String)` on a
    /// malformed payload or unsupported element type.
    fn deserialize(&self, record: &[u8]) -> Result<Value, String> {
        if record.len() < 5 {
            return Err("Invalid array header".to_string());
        }
        let byte_type = record[0];
        let count = u32::from_le_bytes(
            record[1..5]
                .try_into()
                .map_err(|_| "Invalid array count".to_string())?,
        );

        match byte_type {
            x if x == BinaryType::Number as u8 => {
                let codec = NumberCodecSerializer;
                let values = Self::read_elements(record, count, |payload| {
                    match codec.deserialize(payload)? {
                        Value::Number(number) => Ok(number),
                        _ => Err("Invalid number".to_string()),
                    }
                })?;
                Ok(Value::Array(PrimitiveValues::Number(values)))
            }
            x if x == BinaryType::String as u8 => {
                let codec = StringCodecSerializer;
                let values = Self::read_elements(record, count, |payload| {
                    match codec.deserialize(payload)? {
                        Value::String(text) => Ok(text),
                        _ => Err("Invalid string".to_string()),
                    }
                })?;
                Ok(Value::Array(PrimitiveValues::String(values)))
            }
            x if x == BinaryType::Boolean as u8 => {
                let codec = BooleanCodecSerializer;
                let values = Self::read_elements(record, count, |payload| {
                    match codec.deserialize(payload)? {
                        Value::Boolean(flag) => Ok(flag),
                        _ => Err("Invalid boolean".to_string()),
                    }
                })?;
                Ok(Value::Array(PrimitiveValues::Boolean(values)))
            }
            x if x == BinaryType::Date as u8 => {
                let codec = DateCodecSerializer;
                let values = Self::read_elements(record, count, |payload| {
                    match codec.deserialize(payload)? {
                        Value::Date(date) => Ok(date),
                        _ => Err("Invalid date".to_string()),
                    }
                })?;
                Ok(Value::Array(PrimitiveValues::Date(values)))
            }
            _ => Err("Unsupported array element type".to_string()),
        }
    }
}
