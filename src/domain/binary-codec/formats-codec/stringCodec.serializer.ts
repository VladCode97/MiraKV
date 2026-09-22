import { ISerializer } from "../../interfaces/serializar.interface";

/**
 * Serializes and deserializes strings using UTF-8 encoding.
 */
export class StringCodecSerializer implements ISerializer {
  /**
   * Serializes a string using UTF-8 encoding.
   * @param record String value to serialize.
   * @returns Buffer containing the UTF-8 encoded string.
   */
  serialize(record: unknown): Buffer {
    return Buffer.from(record as string, "utf-8");
  }
  /**
   * Deserializes a UTF-8 encoded string.
   * @param record Buffer containing UTF-8 encoded bytes.
   * @returns The decoded string.
   */
  deserialize(record: Buffer): unknown {
    return record.toString("utf-8");
  }
}
