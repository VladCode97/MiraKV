//! Type definitions for the result of parsing a MiraQL command.

use chrono::{DateTime, Utc};

/// Operations supported by the MiraQL language.
///
/// - `Insert` — stores a new value in a collection.
/// - `Get`    — retrieves one or all records from a collection.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Operation {
    Insert,
    Get,
}

/// A homogeneous array of primitives.
///
/// Each variant holds a `Vec` of a single primitive type, so homogeneity is
/// guaranteed by the type system — an array cannot mix, say, numbers and
/// strings. Used as the payload of `Value::Array`.
#[derive(Debug, Clone)]
pub enum PrimitiveValues {
    /// Array of UTF-8 strings.
    String(Vec<String>),
    /// Array of numbers (IEEE 754 binary64).
    Number(Vec<f64>),
    /// Array of booleans.
    Boolean(Vec<bool>),
    /// Array of dates.
    Date(Vec<DateTime<Utc>>),
}

/// A fully parsed MiraQL value.
///
/// Recursive by design: a value is a primitive, an object whose property
/// values are themselves `Value`s, or an array of `Value`s. This mirrors the
/// parser's recursive grammar and supports arbitrary nesting.
///
/// This is the natural Rust counterpart of the TypeScript `TValue` union.
#[derive(Debug, Clone)]
pub enum Value {
    /// UTF-8 string value.
    String(String),
    /// Numeric value (IEEE 754 binary64).
    Number(f64),
    /// Boolean value.
    Boolean(bool),
    /// Date value, kept as its ISO-8601 string for now.
    Date(DateTime<Utc>),
    /// Object: ordered key/value pairs whose values may nest.
    Object(Vec<(String, Value)>),
    /// Homogeneous primitive array (see [`PrimitiveValues`]).
    Array(PrimitiveValues),
}
