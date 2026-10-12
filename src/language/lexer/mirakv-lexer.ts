import { createToken, Lexer } from "chevrotain";

export const Insert = createToken({
  name: "INSERT",
  pattern: /INSERT/,
});

export const In = createToken({
  name: "In",
  pattern: /IN/,
});

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[A-Z](?:[A-Z_]*[A-Z])?/,
});

/**
 * TYPES VALIDS
 */
export const StringType = createToken({
  name: "StringType",
  pattern: /--STRING/,
});

export const NumberType = createToken({
  name: "NumberType",
  pattern: /--NUMBER/,
});

export const BooleanType = createToken({
  name: "BooleanType",
  pattern: /--BOOLEAN/,
});

export const DateType = createToken({
  name: "DateType",
  pattern: /--DATE/,
});

export const ObjectType = createToken({
  name: "ObjectType",
  pattern: /--OBJECT/,
});

export const ArrayType = createToken({
  name: "ArrayType",
  pattern: /--ARRAY/,
});

/**
 * TYPE VALUES
 */
export const NumberValue = createToken({
  name: "NumberValue",
  pattern: /-?[0-9]+(?:\.[0-9]+)?/,
});

export const BooleanValue = createToken({
  name: "BooleanValue",
  pattern: /true|false/,
});

export const StringValue = createToken({
  name: "StringValue",
  pattern: /"(?:\\.|[^"\\])*"/,
});

export const DateValue = createToken({
  name: "DateValue",
  pattern: /"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?"/,
});

export const ObjectStart = createToken({
  name: "ObjectStart",
  pattern: /\{/,
});

export const ObjectEnd = createToken({
  name: "ObjectEnd",
  pattern: /\}/,
});

export const ArrayStart = createToken({
  name: "ArrayStart",
  pattern: /\[/,
});

export const ArrayEnd = createToken({
  name: "ArrayEnd",
  pattern: /\]/,
});

export const Colon = createToken({
  name: "Colon",
  pattern: /:/,
});

export const Comma = createToken({
  name: "Comma",
  pattern: /,/,
});

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

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

export const MiraKVLexer = new Lexer(ALL_TOKENS);
