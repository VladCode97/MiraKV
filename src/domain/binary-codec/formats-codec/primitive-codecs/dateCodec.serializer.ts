import { ISerializer } from "../../../interfaces/serializar.interface";

/**
 * Serializes and deserializes JavaScript `Date` values.
 *
 * The date is currently stored as its ISO-8601 string representation
 * (via `Date.prototype.toISOString`) encoded as UTF-8 bytes, and parsed
 * back with the `Date` constructor on read.
 *
 * @remarks
 * The registry tags this type with the `UNIX_TIMESTAMP_MS` encoding, but
 * the current implementation stores an ISO-8601 string rather than a
 * numeric millisecond timestamp. See the note in `codec.registry.ts` —
 * these should be reconciled (either switch the encoding tag to a UTF-8
 * date encoding, or change this codec to store an 8-byte timestamp).
 */
export class DateCodecSerializer implements ISerializer {
  /**
   * Serializes a `Date` into its ISO-8601 UTF-8 representation.
   *
   * @param record - The `Date` value to serialize.
   * @returns A Buffer containing the UTF-8 encoded ISO-8601 string.
   */
  serialize(record: unknown): Buffer {
    const date = record as Date;
    return Buffer.from(date.toISOString());
  }

  /**
   * Deserializes an ISO-8601 UTF-8 payload back into a `Date`.
   *
   * @param record - Buffer containing the UTF-8 encoded ISO-8601 string.
   * @returns The reconstructed `Date`.
   */
  deserialize(record: Buffer): unknown {
    return new Date(record.toString());
  }
}
