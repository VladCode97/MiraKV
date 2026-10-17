import { BINARY_FORMAT, BINARY_TYPE } from "../constants/binary-types.constant";
import { BinaryEnvelope } from "../envelope/binary.envelope";
import { ISerializer } from "../interfaces/serializar.interface";
import { TBinaryValues } from "../types/binary.types";
import { codecs } from "../../native/mirakv-codecs";
import {
  getTypeOf,
  getCodec,
  getTypeEncode,
} from "./formats-codec/codec.registry";

/**
 * Coordinates binary serialization and deserialization for MiraKV values.
 *
 * Determines the binary type of a value, produces its payload, and wraps that
 * payload in a binary envelope. Payloads for the five primitive-ish types
 * (number, boolean, string, date, array) are produced by the native Rust
 * codecs via {@link codecs}; `object` and `null` still use the TypeScript
 * codecs from the registry.
 */
export class BinaryCodecManager implements ISerializer {
  /**
   * Serializes a value into the MiraKV binary format.
   * Determines the value type, produces its payload, and wraps it in a binary
   * envelope.
   * @param record Value to serialize.
   * @returns A Buffer containing the complete binary representation.
   */
  public serialize(record: unknown): Buffer {
    const type = getTypeOf(record);
    const payload = this.serializePayload(type, record);
    return BinaryEnvelope.Instance.envelope(
      BINARY_FORMAT.VERSION,
      type,
      payload,
      getTypeEncode(type),
    );
  }

  /**
   * Deserializes a MiraKV binary representation.
   * Reads the type and payload length from the envelope, extracts the
   * payload, and decodes it back into its original value.
   * @param record Buffer containing a serialized MiraKV value.
   * @returns The deserialized value.
   */
  public deserialize(record: Buffer): unknown {
    const type = record.readUInt8(1) as TBinaryValues;
    const length = record.readUInt32LE(2);
    const payload = record.subarray(6, 6 + length);
    return this.deserializePayload(type, payload);
  }

  /**
   * Produces the raw payload for a value, delegating to the native Rust
   * codecs for the five supported types and to the TypeScript registry for
   * `object` and `null`.
   * @param type   The resolved binary type of `record`.
   * @param record The value to serialize.
   * @returns The payload bytes (without the envelope).
   */
  private serializePayload(type: TBinaryValues, record: unknown): Buffer {
    switch (type) {
      case BINARY_TYPE.NUMBER:
        return codecs.numberSerialize(record as number);
      case BINARY_TYPE.BOOLEAN:
        return codecs.booleanSerialize(record as boolean);
      case BINARY_TYPE.STRING:
        return codecs.stringSerialize(record as string);
      case BINARY_TYPE.DATE:
        return codecs.dateSerialize((record as Date).toISOString());
      case BINARY_TYPE.ARRAY:
        return this.serializeArray(record as unknown[]);
      default:
        // object, null, and anything else fall back to the TS registry.
        return getCodec(type).serialize(record) as Buffer;
    }
  }

  /**
   * Decodes a raw payload back into a value, mirroring
   * {@link serializePayload}: native Rust codecs for the five supported
   * types, TypeScript registry for the rest.
   * @param type    The binary type read from the envelope.
   * @param payload The payload bytes (without the envelope).
   * @returns The decoded value.
   */
  private deserializePayload(type: TBinaryValues, payload: Buffer): unknown {
    switch (type) {
      case BINARY_TYPE.NUMBER:
        return codecs.numberDeserialize(payload);
      case BINARY_TYPE.BOOLEAN:
        return codecs.booleanDeserialize(payload);
      case BINARY_TYPE.STRING:
        return codecs.stringDeserialize(payload);
      case BINARY_TYPE.DATE:
        return new Date(codecs.dateDeserialize(payload));
      case BINARY_TYPE.ARRAY:
        return this.deserializeArray(payload);
      default:
        return getCodec(type).deserialize(payload);
    }
  }

  /**
   * Serializes a homogeneous array by inspecting its first element to pick
   * the matching native array codec. Empty arrays produce an empty payload.
   * @param array The array to serialize.
   * @returns The array payload bytes.
   * @throws {Error} If the element type is not supported for arrays.
   */
  private serializeArray(array: unknown[]): Buffer {
    if (array.length === 0) {
      return Buffer.alloc(0);
    }
    const first = array[0];
    if (typeof first === "number") {
      return codecs.arrayNumberSerialize(array as number[]);
    }
    if (typeof first === "string") {
      return codecs.arrayStringSerialize(array as string[]);
    }
    if (typeof first === "boolean") {
      return codecs.arrayBooleanSerialize(array as boolean[]);
    }
    if (first instanceof Date) {
      return codecs.arrayDateSerialize(
        (array as Date[]).map((date) => date.toISOString()),
      );
    }
    throw new Error("Unsupported array element type for native serialization");
  }

  /**
   * Decodes an array payload by reading its element-type header byte and
   * dispatching to the matching native array codec. Dates are rebuilt into
   * `Date` instances.
   * @param payload The array payload bytes.
   * @returns The decoded array.
   * @throws {Error} If the element type byte is not supported.
   */
  private deserializeArray(payload: Buffer): unknown[] {
    if (payload.length === 0) {
      return [];
    }
    const elementType = payload.readUInt8(0) as TBinaryValues;
    switch (elementType) {
      case BINARY_TYPE.NUMBER:
        return codecs.arrayNumberDeserialize(payload);
      case BINARY_TYPE.STRING:
        return codecs.arrayStringDeserialize(payload);
      case BINARY_TYPE.BOOLEAN:
        return codecs.arrayBooleanDeserialize(payload);
      case BINARY_TYPE.DATE:
        return codecs
          .arrayDateDeserialize(payload)
          .map((iso) => new Date(iso));
      default:
        throw new Error(
          "Unsupported array element type for native deserialization",
        );
    }
  }
}
