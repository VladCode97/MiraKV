import { isHomogeneousPrimitiveArray } from "../../../../utils/guard.utils";
import { ISerializer } from "../../../interfaces/serializar.interface";
import { TBinaryValues } from "../../../types/binary.types";
import { getCodec, getTypeOf } from "../codec.registry";

/**
 * Serializes and deserializes homogeneous primitive arrays
 * (arrays whose elements are all the same primitive type).
 *
 * The array payload layout is:
 *
 * ```text
 * ┌──────┬───────┬──────────────────────────────────────────┐
 * │ type │ count │  [len₀][elem₀] [len₁][elem₁] ... [lenₙ][elemₙ] │
 * └──────┴───────┴──────────────────────────────────────────┘
 * ```
 *
 * - `type`  → 1 byte: the {@link BINARY_TYPE} shared by all elements.
 * - `count` → 4 bytes (UInt32LE): number of elements.
 * - Each element is length-prefixed with 4 bytes (UInt32LE) followed by
 *   its serialized payload, produced by the element type's codec.
 *
 * Because every element shares one type, the element type is stored once
 * in the header rather than per element.
 */
export class ArrayCodecSeriliazer implements ISerializer {
  /**
   * Serializes a homogeneous primitive array into the MiraKV array payload.
   *
   * @param record - The array to serialize. Must be a homogeneous primitive
   *                  array (see {@link isHomogeneousPrimitiveArray}).
   * @returns A Buffer containing the array header and length-prefixed elements.
   * @throws {TypeError} If `record` is not a homogeneous primitive array.
   */
  serialize(record: unknown): Buffer {
    if (isHomogeneousPrimitiveArray(record)) {
      const header = Buffer.alloc(5);
      const typeValue = getTypeOf(record[0]);
      const codecValue = getCodec(typeValue);
      const type = header.subarray(0, 1);
      type.writeUInt8(typeValue);
      const elements = header.subarray(1, 5);
      elements.writeUInt32LE(record.length);
      const payloads: Buffer[] = [header];
      for (const item of record) {
        const element = codecValue.serialize(item);
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32LE(element.byteLength);
        payloads.push(lengthBuffer);
        payloads.push(element);
      }
      return Buffer.concat(payloads);
    }
    throw new TypeError("Expected a homogeneous primitive array");
  }

  /**
   * Deserializes a MiraKV array payload back into a JavaScript array.
   *
   * Reads the shared element type and count from the header, then walks
   * each length-prefixed element, decoding it with the appropriate codec.
   *
   * @param record - Buffer containing a serialized array payload.
   * @returns The reconstructed array of primitives.
   */
  deserialize(record: Buffer): unknown {
    const typeValue = record.readUInt8(0);
    const codec = getCodec(typeValue as TBinaryValues);
    const count = record.readUInt32LE(1);
    let offset = 5;
    const elements: (typeof typeValue)[] = [];
    for (let i: number = 0; i < count; i++) {
      const length = record.readUInt32LE(offset);
      const elementStart = offset + 4;
      const elementEnd = elementStart + length;
      const payload = record.subarray(elementStart, elementEnd);
      elements.push(codec.deserialize(payload) as TBinaryValues);
      offset = elementEnd;
    }
    return elements;
  }
}
