/**
 * @file parser.type.ts
 * @description Type definitions for the result of parsing a MiraQL command.
 */

/**
 * Operations supported by the MiraQL language.
 *
 * - `INSERT` — stores a new value in a collection.
 * - `GET`    — retrieves a value from a collection.
 */
export type TOperations = "INSERT" | "GET";

/**
 * Structured representation of a parsed MiraQL command.
 *
 * Produced by {@link MiraKVParser} after a token stream is consumed.
 * It carries the operation, the target collection, and the typed value
 * the command operates on.
 */
export type TParser = {
  /** The operation the command performs. */
  operation: TOperations;
  /** Name of the target collection. */
  collection: string;
  /** The MiraKV type of the value being operated on. */
  type: "NUMBER" | "STRING" | "BOOLEAN" | "DATE" | "OBJECT" | "ARRAY";
  /** The parsed value, decoded according to `type`. */
  value: unknown;
};

/**
 * A value together with its declared MiraKV type.
 *
 * A projection of {@link TParser} limited to the `type` and `value` fields,
 * returned by the parser's typed-value rule before the surrounding command
 * metadata (operation, collection) is attached.
 */
export type TTypedValue = Pick<TParser, "type" | "value">;
