//! napi-rs bindings exposing the MiraKV codecs to JavaScript/TypeScript.
//!
//! Each codec is surfaced as a pair of functions — `*_serialize` and
//! `*_deserialize` — that take and return JS-friendly types (numbers,
//! strings, booleans, buffers). The internal `Value` enum does not cross the
//! FFI boundary; these wrappers convert to and from it.
//!
//! Dates cross the boundary as RFC 3339 strings, since JS has no date type
//! that maps cleanly through napi. Serialized output is a `Buffer`
//! (`Vec<u8>`); deserialization returns a `Result`, which napi turns into a
//! thrown JS error on failure.

mod domain;

use chrono::{DateTime, Utc};
use napi::bindgen_prelude::*;
use napi_derive::napi;

use crate::domain::binary_codec::object_codecs::array_codec_serializer::ArrayCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::boolean_codec_serializer::BooleanCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::date_codec_serializer::DateCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::number_codec_serializer::NumberCodecSerializer;
use crate::domain::binary_codec::primitive_codecs::string_codec_serializer::StringCodecSerializer;
use crate::domain::traits::serializer::Serializer;
use crate::domain::types::parser::{PrimitiveValues, Value};

/// Parses an RFC 3339 string into a UTC datetime, mapping failures to a
/// JS error. Shared by the date-related bindings.
fn parse_rfc3339(text: &str) -> Result<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(text)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| Error::from_reason(e.to_string()))
}

// ─── Number ──────────────────────────────────────────────────────────────

/// Serializes a number into its MiraKV binary form.
#[napi]
pub fn number_serialize(value: f64) -> Buffer {
    NumberCodecSerializer
        .serialize(&Value::Number(value))
        .into()
}

/// Deserializes a MiraKV number payload back into a JS number.
#[napi]
pub fn number_deserialize(payload: Buffer) -> Result<f64> {
    match NumberCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::Number(number) => Ok(number),
        _ => Err(Error::from_reason("decoded value is not a number")),
    }
}

// ─── Boolean ─────────────────────────────────────────────────────────────

/// Serializes a boolean into its MiraKV binary form.
#[napi]
pub fn boolean_serialize(value: bool) -> Buffer {
    BooleanCodecSerializer
        .serialize(&Value::Boolean(value))
        .into()
}

/// Deserializes a MiraKV boolean payload back into a JS boolean.
#[napi]
pub fn boolean_deserialize(payload: Buffer) -> Result<bool> {
    match BooleanCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::Boolean(flag) => Ok(flag),
        _ => Err(Error::from_reason("decoded value is not a boolean")),
    }
}

// ─── String ──────────────────────────────────────────────────────────────

/// Serializes a string into its MiraKV binary form.
#[napi]
pub fn string_serialize(value: String) -> Buffer {
    StringCodecSerializer
        .serialize(&Value::String(value))
        .into()
}

/// Deserializes a MiraKV string payload back into a JS string.
#[napi]
pub fn string_deserialize(payload: Buffer) -> Result<String> {
    match StringCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::String(text) => Ok(text),
        _ => Err(Error::from_reason("decoded value is not a string")),
    }
}

// ─── Date ────────────────────────────────────────────────────────────────

/// Serializes an RFC 3339 date string into its MiraKV binary form.
#[napi]
pub fn date_serialize(rfc3339: String) -> Result<Buffer> {
    let date = parse_rfc3339(&rfc3339)?;
    Ok(DateCodecSerializer.serialize(&Value::Date(date)).into())
}

/// Deserializes a MiraKV date payload back into an RFC 3339 string.
#[napi]
pub fn date_deserialize(payload: Buffer) -> Result<String> {
    match DateCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::Date(date) => Ok(date.to_rfc3339()),
        _ => Err(Error::from_reason("decoded value is not a date")),
    }
}

// ─── Array ───────────────────────────────────────────────────────────────

/// Serializes a homogeneous array of numbers into its MiraKV binary form.
#[napi]
pub fn array_number_serialize(values: Vec<f64>) -> Buffer {
    ArrayCodecSerializer
        .serialize(&Value::Array(PrimitiveValues::Number(values)))
        .into()
}

/// Serializes a homogeneous array of strings into its MiraKV binary form.
#[napi]
pub fn array_string_serialize(values: Vec<String>) -> Buffer {
    ArrayCodecSerializer
        .serialize(&Value::Array(PrimitiveValues::String(values)))
        .into()
}

/// Serializes a homogeneous array of booleans into its MiraKV binary form.
#[napi]
pub fn array_boolean_serialize(values: Vec<bool>) -> Buffer {
    ArrayCodecSerializer
        .serialize(&Value::Array(PrimitiveValues::Boolean(values)))
        .into()
}

/// Serializes a homogeneous array of RFC 3339 date strings into its MiraKV
/// binary form.
#[napi]
pub fn array_date_serialize(values: Vec<String>) -> Result<Buffer> {
    let dates = values
        .iter()
        .map(|text| parse_rfc3339(text))
        .collect::<Result<Vec<DateTime<Utc>>>>()?;
    Ok(ArrayCodecSerializer
        .serialize(&Value::Array(PrimitiveValues::Date(dates)))
        .into())
}

/// Deserializes a MiraKV array payload into a JS array of numbers.
#[napi]
pub fn array_number_deserialize(payload: Buffer) -> Result<Vec<f64>> {
    match ArrayCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::Array(PrimitiveValues::Number(values)) => Ok(values),
        _ => Err(Error::from_reason("decoded value is not a number array")),
    }
}

/// Deserializes a MiraKV array payload into a JS array of strings.
#[napi]
pub fn array_string_deserialize(payload: Buffer) -> Result<Vec<String>> {
    match ArrayCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::Array(PrimitiveValues::String(values)) => Ok(values),
        _ => Err(Error::from_reason("decoded value is not a string array")),
    }
}

/// Deserializes a MiraKV array payload into a JS array of booleans.
#[napi]
pub fn array_boolean_deserialize(payload: Buffer) -> Result<Vec<bool>> {
    match ArrayCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::Array(PrimitiveValues::Boolean(values)) => Ok(values),
        _ => Err(Error::from_reason("decoded value is not a boolean array")),
    }
}

/// Deserializes a MiraKV array payload into a JS array of RFC 3339 date
/// strings.
#[napi]
pub fn array_date_deserialize(payload: Buffer) -> Result<Vec<String>> {
    match ArrayCodecSerializer
        .deserialize(&payload)
        .map_err(Error::from_reason)?
    {
        Value::Array(PrimitiveValues::Date(values)) => {
            Ok(values.iter().map(|d| d.to_rfc3339()).collect())
        }
        _ => Err(Error::from_reason("decoded value is not a date array")),
    }
}
