/**
 * Binary type identifiers used by the MiraKV binary format.
 * Each identifier represents the semantic type of a serialized value.
 */
export const BINARY_TYPE = {
  RESERVED: 0x00,
  BOOLEAN: 0x01,
  NUMBER: 0x02,
  STRING: 0x03,
  OBJECT: 0x04,
  NULL: 0x05,
} as const;

/**
 * Identifies the binary encoding used to represent a value's payload.
 * The encoding is stored in the final byte of a MiraKV binary envelope:
 * [version][type][length][payload][encoding]
 * The `type` describes what the value is, while `encoding` describes
 * how that value is represented at the binary level.
 */
export const ENCODING = {
  RESERVED: 0x00,
  IEEE_754_BINARY64: 0x01,
  UTF_8: 0x02,
  BOOLEAN_8: 0x03,
} as const;

/**
 * Global configuration of the MiraKV binary format.
 * These properties apply to all binary codecs unless explicitly
 * overridden by a type-specific encoding rule.
 */
export const BINARY_FORMAT = {
  VERSION: 1,
  ENDIAN: "LE", //Little-Endian,
} as const;

/**
 * Binary representation of JavaScript numbers.
 * Numbers are encoded using IEEE 754 binary64 representation.
 */
export const NUMBER_FORMAT = {
  type: BINARY_TYPE.NUMBER,
  SIZE_BYTE: 8,
  ENCODING: ENCODING.IEEE_754_BINARY64,
} as const;

/**
 * Defines the binary format used to represent boolean values.
 * Boolean values are stored using a single byte.
 */
export const BOOLEAN_FORMAT = {
  type: BINARY_TYPE.BOOLEAN,
  SIZE_BYTE: 1,
};

/**
 * Defines the binary format used to represent string values.
 * Strings are encoded using UTF-8.
 * The encoded size depends on the string content.
 */
export const STRING_FORMAT = {
  type: BINARY_TYPE.STRING,
};
