//! Serializes and deserializes booleans using the MiraKV single-byte
//! representation (`0` = false, `1` = true).

use crate::domain::traits::serializer::Serializer;
use crate::domain::types::parser::Value;

/// Codec for boolean values.
///
/// A boolean is stored in a single byte: `0` for `false`, `1` for `true` —
/// the same layout produced by the TypeScript `BooleanCodecSerializer`.
pub struct BooleanCodecSerializer;

impl Serializer for BooleanCodecSerializer {
    /// Serializes a boolean into a single byte.
    ///
    /// # Arguments
    /// * `record` - The value to serialize (expected to hold a `Boolean`).
    ///
    /// # Returns
    /// A one-byte buffer: `1` for `true`, `0` for `false`.
    fn serialize(&self, record: &Value) -> Vec<u8> {
        match record {
            Value::Boolean(value) => vec![*value as u8],
            other => panic!("BooleanCodec expected Boolean, got {:?}", other),
        }
    }

    /// Deserializes a single-byte payload back into a boolean.
    ///
    /// Any non-zero byte is treated as `true`; zero is `false`.
    ///
    /// # Arguments
    /// * `record` - Buffer containing the boolean payload (first byte used).
    ///
    /// # Returns
    /// `Ok(Value::Boolean)` with the decoded value, or `Err(String)` if the
    /// payload is empty.
    fn deserialize(&self, record: &[u8]) -> Result<Value, String> {
       let byte = *record.first()
           .ok_or_else(|| "boolean payload is empty".to_string())?;
        Ok(Value::Boolean(byte != 0))
    }
}