//! Serialization contract for MiraKV binary data.

use crate::domain::types::parser::Value;

/// Defines serialization and deserialization operations for MiraKV binary
/// data.
///
/// The Rust counterpart of the TypeScript `ISerializer` interface. Named
/// `Serializer` here following Rust trait naming conventions (no `I` prefix).
pub trait Serializer {
    /// Serializes a value into its binary representation.
    ///
    /// # Arguments
    /// * `value` - Value to serialize.
    ///
    /// # Returns
    /// The binary representation of the value.
    fn serialize(&self, record: &Value) -> Vec<u8>;

    /// Deserializes a binary representation back into a value.
    ///
    /// # Arguments
    /// * `record` - Binary data to deserialize.
    ///
    /// # Returns
    /// `Ok(Value)` with the decoded value, or `Err(String)` describing why
    /// decoding failed.
    fn deserialize(&self, record: &[u8]) -> Result<Value, String>;
}
