/**
 * @file mirakv-lexer.ts
 * @description Token definitions and lexer for the MiraQL query language.
 *
 * Tokens fall into five groups: keywords, identifiers, type markers
 * (prefixed with `--`), literal values, and structural punctuation.
 * {@link ALL_TOKENS} defines their matching precedence, and
 * {@link MiraKVLexer} is the configured lexer that produces the token
 * stream consumed by `MiraKVParser`.
 */
import { createToken, Lexer } from "chevrotain";

/** Keyword that begins an insert command: `INSERT`. */
export const Insert = createToken({
  name: "INSERT",
  pattern: /INSERT/,
});

/** Keyword linking the operation to its target collection: `IN`. */
export const In = createToken({
  name: "In",
  pattern: /IN/,
});

/** A collection or field name: uppercase letters, optionally underscore-separated. */
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[A-Z](?:[A-Z_]*[A-Z])?/,
});

/**
 * Type markers.
 *
 * Each `--TYPE` token declares the MiraKV type of the value that follows,
 * letting the parser validate the value against its declared type.
 */
/** Declares a string value: `--STRING`. */
export const StringType = createToken({
  name: "StringType",
  pattern: /--STRING/,
});

/** Declares a numeric value: `--NUMBER`. */
export const NumberType = createToken({
  name: "NumberType",
  pattern: /--NUMBER/,
});

/** Declares a boolean value: `--BOOLEAN`. */
export const BooleanType = createToken({
  name: "BooleanType",
  pattern: /--BOOLEAN/,
});

/** Declares a date value: `--DATE`. */
export const DateType = createToken({
  name: "DateType",
  pattern: /--DATE/,
});

/** Declares an object value: `--OBJECT`. */
export const ObjectType = createToken({
  name: "ObjectType",
  pattern: /--OBJECT/,
});

/** Declares an array value: `--ARRAY`. */
export const ArrayType = createToken({
  name: "ArrayType",
  pattern: /--ARRAY/,
});

/**
 * Literal values.
 *
 * The concrete values a command carries, matched after their type marker.
 */

/** A numeric literal, optionally signed and decimal (e.g. `29`, `-3.14`). */
export const NumberValue = createToken({
  name: "NumberValue",
  pattern: /-?[0-9]+(?:\.[0-9]+)?/,
});

/** A boolean literal: `true` or `false`. */
export const BooleanValue = createToken({
  name: "BooleanValue",
  pattern: /true|false/,
});

/** A double-quoted string literal with escape support. */
export const StringValue = createToken({
  name: "StringValue",
  pattern: /"(?:\\.|[^"\\])*"/,
});

/** A quoted ISO-8601 date literal (date, optionally with time and ms). */
export const DateValue = createToken({
  name: "DateValue",
  pattern: /"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?"/,
});

/** Opening brace of an object: `{`. */
export const ObjectStart = createToken({
  name: "ObjectStart",
  pattern: /\{/,
});

/** Closing brace of an object: `}`. */
export const ObjectEnd = createToken({
  name: "ObjectEnd",
  pattern: /\}/,
});

/** Opening bracket of an array: `[`. */
export const ArrayStart = createToken({
  name: "ArrayStart",
  pattern: /\[/,
});

/** Closing bracket of an array: `]`. */
export const ArrayEnd = createToken({
  name: "ArrayEnd",
  pattern: /\]/,
});

/** Key/value separator inside an object: `:`. */
export const Colon = createToken({
  name: "Colon",
  pattern: /:/,
});

/** Element separator in objects and arrays: `,`. */
export const Comma = createToken({
  name: "Comma",
  pattern: /,/,
});

/** Whitespace between tokens. Skipped — never emitted to the parser. */
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

/**
 * All tokens in matching-precedence order.
 *
 * Order matters: earlier tokens are tried first, so more specific patterns
 * (e.g. `DateValue`) must precede the more general ones they overlap with
 * (e.g. `StringValue`).
 */
export const ALL_TOKENS = [
  //Keywords
  Insert,
  In,
  //Identifier
  Identifier,
  //Types
  NumberType,
  StringType,
  BooleanType,
  DateType,
  ObjectType,
  ArrayType,
  //Values
  NumberValue,
  BooleanValue,
  DateValue,
  StringValue,
  //Structure
  ObjectStart,
  ObjectEnd,
  ArrayStart,
  ArrayEnd,
  Colon,
  Comma,
  WhiteSpace,
];

/**
 * The MiraQL lexer, configured with {@link ALL_TOKENS}.
 * Call `MiraKVLexer.tokenize(input)` to turn a MiraQL string into the
 * token stream consumed by `MiraKVParser`.
 */
export const MiraKVLexer = new Lexer(ALL_TOKENS);
