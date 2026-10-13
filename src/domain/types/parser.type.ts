/**
 * @file parser.type.ts
 * @description Type definitions for the result of parsing a MiraQL command.
 */

/**
 * Operations supported by the MiraQL language.
 *
 * - `INSERT` — stores a new value in a collection.
 * - `GET`    — retrieves one or all records from a collection.
 */
export type TOperations = "INSERT" | "GET";

/**
 * A parsed `INSERT` command.
 *
 * Carries the target collection and the typed value to store.
 */
export type TInsertCommand = {
  /** Discriminant: always `"INSERT"`. */
  operation: "INSERT";
  /** Name of the target collection. */
  collection: string;
  /**
   * Primary identity of the record, declared explicitly in the command.
   * Used as the index key for retrieval. This identifies the record; it
   * does not dictate how the engine chooses to index it internally.
   */
  key: string;
  /** The MiraKV type of the value being inserted. */
  type: "NUMBER" | "STRING" | "BOOLEAN" | "DATE" | "OBJECT" | "ARRAY";
  /** The parsed value, decoded according to `type`. */
  value: unknown;
};

/**
 * A parsed `GET` command.
 *
 * Has two forms, distinguished by whether `key` is present:
 * - with `key`    → fetch a single record (equivalent to `findById`).
 * - without `key` → fetch all records (equivalent to `find`).
 */
export type TGetCommand = {
  /** Discriminant: always `"GET"`. */
  operation: "GET";
  /** Name of the target collection. */
  collection: string;
  /** Key of the record to fetch; omitted to fetch the whole collection. */
  key?: string;
};

/**
 * Structured representation of a parsed MiraQL command.
 *
 * A discriminated union over {@link TInsertCommand} and {@link TGetCommand},
 * keyed by `operation`. Produced by {@link MiraKVParser} after a token stream
 * is consumed. Narrow on `operation` to access the fields of each variant.
 */
export type TParser = TInsertCommand | TGetCommand;

/**
 * A value together with its declared MiraKV type.
 *
 * A projection of {@link TInsertCommand} limited to the `type` and `value`
 * fields, returned by the parser's typed-value rule before the surrounding
 * command metadata (operation, collection) is attached.
 */
export type TTypedValue = Pick<TInsertCommand, "type" | "value">;

/**
 * A fully parsed MiraQL value.
 *
 * Recursive by design: a value is a primitive, an object whose property
 * values are themselves `TValue`s, or an array of `TValue`s. This mirrors
 * the parser's recursive grammar and supports arbitrary nesting.
 */
export type TValue =
  | string
  | number
  | boolean
  | Date
  | { [key: string]: TValue }
  | TValue[];
