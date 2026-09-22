import {
  BINARY_FORMAT,
  BINARY_TYPE,
  ENCODING,
} from "../constants/binary-types.constant";
import { BinaryEnvelope } from "../envelope/binary.envelope";
import { ISerializer } from "../interfaces/serializar.interface";
import { TBinaryValues, TEncodeValue } from "../types/binary.types";
import { BooleanCodecSerializer } from "./formats-codec/booleanCodec.serializer";
import { NumberCodecSerializer } from "./formats-codec/numberCodec.serializer";
import { StringCodecSerializer } from "./formats-codec/stringCodec.serializer";

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
    const type = this.getTypeOf(record);
    const codec = this.getCodec(type);
    const payload = codec.serialize(record);
    return BinaryEnvelope.Instance.envelope(
      BINARY_FORMAT.VERSION,
      type,
      payload,
      this.getTypeEncode(type),
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
    const codec = this.getCodec(type as TBinaryValues);
    const payload = record.subarray(6, 6 + length);
    return codec.deserialize(payload);
  }

  /**
   * Returns the serializer responsible for a given binary type.
   * @param dataKind Binary type identifier.
   * @returns The serializer associated with the specified type.
   * @throws Error if no serializer is registered for the type.
   */
  public getCodec(dataKind: TBinaryValues): ISerializer {
    switch (dataKind) {
      case BINARY_TYPE.NUMBER:
        return new NumberCodecSerializer();
      case BINARY_TYPE.BOOLEAN:
        return new BooleanCodecSerializer();
      case BINARY_TYPE.STRING:
        return new StringCodecSerializer();
      default:
        throw new Error();
    }
  }

  /**
   * Returns the binary encoding associated with a data type.
   * @param type Binary type identifier.
   * @returns Encoding identifier used to represent the type's payload.
   */
  getTypeEncode(type: TBinaryValues): TEncodeValue {
    switch (type) {
      case BINARY_TYPE.NUMBER:
        return ENCODING.IEEE_754_BINARY64;
      case BINARY_TYPE.STRING:
        return ENCODING.UTF_8;
      case BINARY_TYPE.BOOLEAN:
        return ENCODING.BOOLEAN_8;
      default:
        return ENCODING.RESERVED;
    }
  }

  /**
   * Determines the MiraKV binary type associated with a JavaScript value.
   * @param record JavaScript value to inspect.
   * @returns The corresponding MiraKV binary type identifier.
   */
  private getTypeOf(record: unknown): TBinaryValues {
    if (record === null) return BINARY_TYPE.NULL;
    const type = typeof record;
    if (type === "object") {
      return BINARY_TYPE.OBJECT;
    } else if (type === "string") {
      return BINARY_TYPE.STRING;
    } else if (type === "boolean") {
      return BINARY_TYPE.BOOLEAN;
    } else if (type === "number") {
      return BINARY_TYPE.NUMBER;
    } else {
      return BINARY_TYPE.RESERVED;
    }
  }
}
