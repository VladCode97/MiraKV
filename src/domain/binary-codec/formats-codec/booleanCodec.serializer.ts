import { BOOLEAN_FORMAT } from "../../constants/binary-types.constant";
import { ISerializer } from "../../interfaces/serializar.interface";

/**
 * Serializes and deserializes boolean values using the
 * MiraKV BOOLEAN_8 representation.
 */
export class BooleanCodecSerializer implements ISerializer {
  /**
   * Serializes a boolean using the MiraKV BOOLEAN_8 representation.
   * `true` is represented by 1 and `false` by 0.
   * @param record Boolean value to serialize.
   * @returns A one-byte Buffer containing the boolean representation.
   */
  serialize(record: unknown): Buffer {
    const buffer = new ArrayBuffer(BOOLEAN_FORMAT.SIZE_BYTE);
    const dataView = new DataView(buffer);
    const byteValue = record ? 1 : 0;
    dataView.setUint8(0, byteValue);
    return Buffer.from(dataView.buffer);
  }

  /**
   * Deserializes a BOOLEAN_8 payload.
   * @param record Buffer containing the boolean representation.
   * @returns The decoded boolean value.
   */
  deserialize(record: Buffer): unknown {
    const dataView = new DataView(
      record.buffer,
      record.byteOffset,
      record.byteLength,
    );
    return dataView.getUint8(0) === 1;
  }
}
