//! Serializes and deserializes strings using UTF-8 encoding.
//! Strings are variable-length: the payload uses all of its bytes.

use crate::domain::traits::serializer::Serializer;
use crate::domain::types::parser::Value;

/// Codec for UTF-8 string values.
///
/// Unlike fixed-size codecs (number, boolean), a string spans all the bytes
/// of its payload — there is no fixed length. Mirrors the TypeScript
/// `StringCodecSerializer`.
pub struct StringCodecSerializer;

impl Serializer for StringCodecSerializer {
    /// Serializes a string into its UTF-8 bytes.
    ///
    /// # Arguments
    /// * `record` - The value to serialize (expected to hold a `String`).
    ///
    /// # Returns
    /// The UTF-8 encoded bytes of the string.
    fn serialize(&self, record: &Value) -> Vec<u8> {
        match record {
            Value::String(value) => value.as_bytes().to_vec(),
            other => panic!("StringCodec expected String, got {:?}", other),
        }
    }

    /// Deserializes a UTF-8 payload back into a string.
    ///
    /// Uses the entire slice, since strings are variable-length.
    ///
    /// # Arguments
    /// * `record` - Buffer containing the UTF-8 encoded bytes.
    ///
    /// # Returns
    /// `Ok(Value::String)` with the decoded text, or `Err(String)` if the
    /// bytes are not valid UTF-8.
    fn deserialize(&self, record: &[u8]) -> Result<Value, String> {
        let bytes = String::from_utf8(record.to_vec()).map_err(|e| e.to_string())?;
        Ok(Value::String(bytes))
    }
}
