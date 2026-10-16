//! Serializes and deserializes numbers using the MiraKV IEEE 754 binary64
//! representation (8 bytes, little-endian).

use crate::domain::traits::serializer::Serializer;
use crate::domain::types::parser::Value;

/// Codec for `f64` numbers.
///
/// Numbers are stored as 8-byte IEEE 754 binary64, little-endian — the same
/// layout produced by the TypeScript `NumberCodecSerializer`.
pub struct NumberCodecSerializer;

impl Serializer for NumberCodecSerializer {
    /// Serializes an `f64` into 8 little-endian bytes.
    ///
    /// # Arguments
    /// * `record` - The value to serialize (expected to hold an `f64`).
    ///
    /// # Returns
    /// An 8-byte little-endian IEEE 754 binary64 buffer.
    fn serialize(&self, record: &Value) -> Vec<u8> {
       match record {
           Value::Number(value) => value.to_le_bytes().to_vec(),
           other => panic!("NumberCodec expected Number, got {:?}", other),
       }
    }

    /// Deserializes an 8-byte IEEE 754 binary64 payload back into a number.
    ///
    /// # Arguments
    /// * `record` - Buffer containing the 8-byte binary64 payload.
    ///
    /// # Returns
    /// `Ok(Value::Number)` with the decoded value, or `Err(String)` if the
    /// payload is not exactly 8 bytes.
    fn deserialize(&self, record: &[u8]) -> Result<Value, String> {
       let bytes: [u8; 8] = record.try_into()
           .map_err(|_| "number payload must be exactly 8 bytes".to_string())?;
       Ok(Value::Number(f64::from_le_bytes(bytes)))
    }
}
