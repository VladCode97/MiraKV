import {
  BINARY_FORMAT,
  NUMBER_FORMAT,
} from "../../constants/binary-types.constant";
import { ISerializer } from "../../interfaces/serializar.interface";

/**
 * Serializes and deserializes JavaScript numbers using the
 * MiraKV IEEE 754 binary64 representation.
 */
export class NumberCodecSerializer implements ISerializer {
  /**
   * Serializes a JavaScript number using IEEE 754 binary64 representation.
   * The resulting payload occupies 8 bytes and follows
   * the byte order defined by the MiraKV binary format.
   * @param record Number value to serialize.
   * @returns Buffer containing the binary64 representation.
   */
  serialize(record: unknown): Buffer {
    const buffer = new ArrayBuffer(NUMBER_FORMAT.SIZE_BYTE);
    const dataView = new DataView(buffer);
    dataView.setFloat64(0, record as number, BINARY_FORMAT.ENDIAN === "LE");
    return Buffer.from(dataView.buffer);
  }

  /**
   * Deserializes an IEEE 754 binary64 number.
   * @param record Buffer containing the binary64 payload.
   * @returns The decoded number.
   */
  deserialize(record: Buffer): number {
    const dataView = new DataView(
      record.buffer,
      record.byteOffset,
      record.byteLength,
    );
    const numberDes = dataView.getFloat64(0, BINARY_FORMAT.ENDIAN === "LE");
    return numberDes;
  }
}
