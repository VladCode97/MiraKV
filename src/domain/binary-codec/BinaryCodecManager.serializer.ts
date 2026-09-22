import {
  BINARY_FORMAT,
  BINARY_TYPE,
  ENCODING,
} from "../constants/binary-types.constant";
import { BinaryEnvelope } from "../envelope/binary.envelope";
import { ISerializer } from "../interfaces/serializar.interface";
import { TBinaryValues, TEncodeValue } from "../types/binary.types";
import {
  getTypeOf,
  getCodec,
  getTypeEncode,
} from "./formats-codec/codec.registry";

/**
 * Coordinates binary serialization and deserialization for MiraKV values.
 * Determines the binary type of a JavaScript value, selects the appropriate
 * codec, and wraps the serialized payload in a binary envelope.
 */

export class BinaryCodecManager implements ISerializer {
  /**
   * Serializes a value into the MiraKV binary format.
   * Determines the value type, selects the corresponding codec,
   * serializes the value into a payload, and wraps it in a binary envelope.
   * @param record Value to serialize.
   * @returns A Buffer containing the complete binary representation.
   */
  public serialize(record: unknown): Buffer {
    const type = getTypeOf(record);
    const codec = getCodec(type);
    const payload = codec.serialize(record);
    return BinaryEnvelope.Instance.envelope(
      BINARY_FORMAT.VERSION,
      type,
      payload,
      getTypeEncode(type),
    );
  }

  /**
   * Deserializes a MiraKV binary representation.
   * Reads the record type and payload length from the binary envelope,
   * extracts the payload, selects the corresponding codec, and
   * deserializes the payload into its original value.
   * @param record Buffer containing a serialized MiraKV value.
   * @returns The deserialized value.
   */
  public deserialize(record: Buffer): unknown {
    const type = record.readUInt8(1);
    const length = record.readUInt32LE(2);
    const codec = getCodec(type as TBinaryValues);
    const payload = record.subarray(6, 6 + length);
    return codec.deserialize(payload);
  }
}
