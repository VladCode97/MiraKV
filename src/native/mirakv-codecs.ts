/**
 * @file mirakv-codecs.ts
 * @description Bridge to the native MiraKV codecs compiled from Rust via
 * napi-rs.
 *
 * The native addon (`MiraKV/index.node`) exposes serialize/deserialize
 * functions for each MiraKV value type. This module loads that addon and
 * re-exports its functions behind a typed surface so the rest of the
 * TypeScript code never touches the raw binary directly.
 *
 * All `serialize*` functions return a Node `Buffer`; all `deserialize*`
 * functions take a `Buffer` and throw if the payload is malformed.
 */

/**
 * Shape of the native addon, mirroring the napi-generated `index.d.ts`.
 * Names are camelCase because napi converts Rust's snake_case automatically.
 */
interface MiraKVNative {
  numberSerialize(value: number): Buffer;
  numberDeserialize(payload: Buffer): number;

  booleanSerialize(value: boolean): Buffer;
  booleanDeserialize(payload: Buffer): boolean;

  stringSerialize(value: string): Buffer;
  stringDeserialize(payload: Buffer): string;

  /** Dates cross the boundary as RFC 3339 strings. */
  dateSerialize(rfc3339: string): Buffer;
  dateDeserialize(payload: Buffer): string;

  arrayNumberSerialize(values: number[]): Buffer;
  arrayNumberDeserialize(payload: Buffer): number[];

  arrayStringSerialize(values: string[]): Buffer;
  arrayStringDeserialize(payload: Buffer): string[];

  arrayBooleanSerialize(values: boolean[]): Buffer;
  arrayBooleanDeserialize(payload: Buffer): boolean[];

  arrayDateSerialize(values: string[]): Buffer;
  arrayDateDeserialize(payload: Buffer): string[];
}

/**
 * Loads the native `.node` addon.
 *
 * The addon is a native module (not a JS/TS file), so it is loaded with a
 * CommonJS `require` resolved relative to this file (`src/native/`). Adjust
 * the path if the compiled binary moves.
 */
const native: MiraKVNative = require("../../MiraKV/index.node");

/**
 * Normalizes a date string to the canonical ISO form used across the TS side
 * (`Date.prototype.toISOString`, e.g. `2026-02-25T00:00:00.000Z`).
 *
 * The native layer emits RFC 3339 with a numeric offset (`...+00:00`), which
 * is the same instant but a different spelling. Normalizing here keeps every
 * date the TS code sees in one consistent format, regardless of which layer
 * produced it. The bytes on disk still use the native RFC 3339 form.
 */
function toIso(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Typed facade over the native MiraKV codecs.
 *
 * Mostly a direct pass-through to {@link native}; the only adjustment is that
 * date reads are normalized to ISO form via {@link toIso}, so the rest of the
 * TypeScript code never has to deal with the native `+00:00` spelling.
 */
export const codecs: MiraKVNative = {
  ...native,

  dateDeserialize(payload: Buffer): string {
    return toIso(native.dateDeserialize(payload));
  },

  arrayDateDeserialize(payload: Buffer): string[] {
    return native.arrayDateDeserialize(payload).map(toIso);
  },
};
