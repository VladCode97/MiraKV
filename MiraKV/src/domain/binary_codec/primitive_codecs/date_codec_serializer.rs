//! Serializes and deserializes dates using their RFC 3339 string form.
//!
//! A date is stored as its RFC 3339 text (the Rust equivalent of
//! JavaScript's `toISOString()`), encoded as UTF-8. On read the text is
//! parsed back into a `DateTime<Utc>`, so an invalid date is rejected rather
//! than silently accepted — the type guarantees a `Value::Date` always holds
//! a real date.

use crate::domain::traits::serializer::Serializer;
use crate::domain::types::parser::Value;
use chrono::{DateTime, Utc};

/// Codec for date values (`DateTime<Utc>`).
///
/// Dates are stored as variable-length RFC 3339 text. Round-trips preserve
/// the instant; the displayed zero offset may switch between `+00:00` and
/// `Z`, which denote the same UTC time.
pub struct DateCodecSerializer;

impl Serializer for DateCodecSerializer {
    /// Serializes a date into its RFC 3339 UTF-8 representation.
    ///
    /// # Arguments
    /// * `record` - The value to serialize (expected to hold a `Date`).
    ///
    /// # Returns
    /// The UTF-8 bytes of the RFC 3339 date string.
    fn serialize(&self, record: &Value) -> Vec<u8> {
        match record {
            Value::Date(value) => value.to_rfc3339().as_bytes().to_vec(),
            other => panic!("DateCodec expected Date, got {:?}", other),
        }
    }

    /// Deserializes an RFC 3339 payload back into a `DateTime<Utc>`.
    ///
    /// Decoding happens in two fallible steps — UTF-8 decode, then RFC 3339
    /// parse — so malformed bytes or an invalid date produce an `Err`. The
    /// parsed value (which carries its own offset) is converted to UTC.
    ///
    /// # Arguments
    /// * `record` - Buffer containing the UTF-8 RFC 3339 date string.
    ///
    /// # Returns
    /// `Ok(Value::Date)` with the decoded date, or `Err(String)` if the bytes
    /// are not valid UTF-8 or not a valid RFC 3339 date.
    fn deserialize(&self, record: &[u8]) -> Result<Value, String> {
        let text = String::from_utf8(record.to_vec()).map_err(|e| e.to_string())?;
        let parsed = DateTime::parse_from_rfc3339(&text).map_err(|e| e.to_string())?;
        Ok(Value::Date(parsed.with_timezone(&Utc)))
    }
}
