//! Type identifiers, encodings, and per-type format constants that define
//! the MiraKV binary format.

/// Binary type identifiers used by the MiraKV binary format.
/// Each identifier represents the semantic type of serialized value.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum BinaryType {
    /// Reserved / unsupported type.
    Reserved = 0x00,
    /// Boolean value.
    Boolean = 0x01,
    /// Numeric value (IEEE 754 binary64).
    Number = 0x02,
    /// UTF-8 string value.
    String = 0x03,
    /// Object value (may contain nested values).
    Object = 0x04,
    /// Explicit null value.
    Null = 0x05,
    /// Date value.
    Date = 0x06,
    /// Homogeneous primitive array.
    Array = 0x07,
}

/// Identifies the binary encoding used to represent a value's payload.
///
/// The encoding is stored in the final byte of a MiraKV binary envelope:
/// `[version][type][length][payload][encoding]`. The type describes what the
/// value is, while the encoding describes how it is represented at the byte
/// level.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Encoding {
    /// Reserved / no specific encoding.
    Reserved = 0x00,
    /// 64-bit floating point, IEEE 754 binary64.
    Ieee754Binary64 = 0x01,
    /// UTF-8 encoded text.
    Utf8 = 0x02,
    /// Single-byte boolean (0 or 1).
    Boolean8 = 0x03,
    /// Unix timestamp in milliseconds.
    UnixTimestampMs = 0x04,
    /// Homogeneous array with length-prefixed elements.
    HomogeneousArray = 0x05,
}

/// Current version of the MiraKV binary format, written in the envelope.
pub const VERSION: u8 = 1;

/// Size in bytes of a serialized number (IEEE 754 binary64).
pub const NUMBER_SIZE_BYTES: usize = 8;

/// Size in bytes of a serialized boolean.
pub const BOOLEAN_SIZE_BYTES: usize = 1;

// Note on endianness: the TypeScript source carries an `ENDIAN: "LE"` string
// constant. In Rust the byte order is expressed directly through the
// `*_le_bytes` methods (e.g. `f64::to_le_bytes`), so there is no equivalent
// string constant to migrate here.
