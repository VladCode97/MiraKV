/**
 * Defines serialization and deserialization operations
 * for MiraKV binary data.
 */
export interface ISerializer {
  /**
   * Serializes a value into a binary representation.
   *
   * @param record Value to serialize.
   * @returns Binary representation of the value.
   */
  serialize(record: unknown): Buffer;
  /**
   * Deserializes a binary representation into a value.
   *
   * @param record Binary data to deserialize.
   * @returns Deserialized value.
   */
  deserialize(record: Buffer): unknown;
}
