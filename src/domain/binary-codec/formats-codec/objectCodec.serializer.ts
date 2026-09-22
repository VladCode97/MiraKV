import { ISerializer } from "../../interfaces/serializar.interface";
import { isObject } from "../../../utils/guard.utils";
import { getTypeOf, getCodec, getTypeEncode } from "./codec.registry";
import { BINARY_FORMAT } from "../../constants/binary-types.constant";
import { BinaryEnvelope } from "../../envelope/binary.envelope";
import { TBinaryValues } from "../../types/binary.types";

/**
 * Serializes and deserializes JavaScript objects using the MiraKV binary format.
 * Each object property is represented as:
 * [KEY_LENGTH][KEY][VALUE_ENVELOPE]
 * where VALUE_ENVELOPE follows the standard MiraKV binary envelope:
 * [version][type][length][payload][encoding]
 * Property values are serialized through the codec registry, allowing
 * supported primitive values and nested objects to use their corresponding
 * codecs.
 */
export class ObjectCodecSerializer implements ISerializer {
  /**
   * Serializes a JavaScript object into the MiraKV object payload format.
   * Each property is converted into a binary property buffer containing
   * its key length, UTF-8 encoded key, and serialized value envelope.
   * All property buffers are then combined into a contiguous object payload.
   * @param record Object to serialize.
   * @returns Buffer containing the serialized object payload.
   * @throws Error if the value is not a valid MiraKV object.
   * @throws Error if the object contains no properties.
   */
  serialize(record: unknown): Buffer {
    if (!isObject(record)) {
      throw new Error("ERRRO: Object not is a record");
    }
    if (this.isObjectEmpty(record)) {
      throw new Error("ERRRO: Object is empty");
    }
    const entriesRecord = Object.entries(record);
    const propertyBuffers: Buffer[] = [];
    for (const [key, value] of entriesRecord) {
      const keyBuffer = Buffer.from(key, "utf-8");
      const keyLength = keyBuffer.byteLength;
      const typeValue = getTypeOf(value);
      const codecValue = getCodec(typeValue);
      const payload = codecValue.serialize(value);
      const payloadTranform = BinaryEnvelope.Instance.envelope(
        BINARY_FORMAT.VERSION,
        typeValue,
        payload,
        getTypeEncode(typeValue),
      );
      const envelopeBuffer = Buffer.alloc(
        1 + keyLength + payloadTranform.byteLength,
      );
      const keyLengthBuffer = envelopeBuffer.subarray(0, 1);
      keyLengthBuffer.writeInt8(keyLength);
      const keyValueBuffer = envelopeBuffer.subarray(1, 1 + keyLength);
      keyBuffer.copy(keyValueBuffer);
      const payloadBuffer = envelopeBuffer.subarray(
        1 + keyLength,
        1 + keyLength + payloadTranform.byteLength,
      );
      payloadTranform.copy(payloadBuffer);
      propertyBuffers.push(envelopeBuffer);
    }
    const totalSizeBuffer = propertyBuffers.reduce(
      (total, buffer) => total + buffer.byteLength,
      0,
    );
    const objectPayloadBuffer = Buffer.alloc(totalSizeBuffer);
    let offset = 0;
    for (const envelopeBuffer of propertyBuffers) {
      envelopeBuffer.copy(objectPayloadBuffer, offset);
      offset += envelopeBuffer.byteLength;
    }
    return objectPayloadBuffer;
  }

  /**
   * Deserializes a MiraKV object payload into a JavaScript object.
   *
   * @param record Binary object payload to deserialize.
   * @returns The deserialized JavaScript object.
   */
  deserialize(record: Buffer): unknown {
    const object: Record<string, unknown> = {};
    let offset = 0;
    while (offset < record.byteLength) {
      const keyLength = record.readUInt8(offset);
      offset += 1;
      const keyBuffer = record.subarray(offset, offset + keyLength);
      const key = keyBuffer.toString("utf-8");
      offset += keyLength;
      const type = record.readUInt8(offset + 1);
      const length = record.readUInt32LE(offset + 2);
      const envelopeLength = 6 + length + 1;
      const envelopeBuffer = record.subarray(offset, offset + envelopeLength);
      const payload = envelopeBuffer.subarray(6, 6 + length);
      const codec = getCodec(type as TBinaryValues);
      const value = codec.deserialize(payload);
      object[key] = value;
      offset += envelopeLength;
    }
    return object;
  }

  /**
   * Determines whether an object contains no own enumerable properties.
   *
   * @param object Object to inspect.
   * @returns `true` when the object contains no enumerable properties.
   */
  private isObjectEmpty(object: Record<string, unknown>): boolean {
    return Object.keys(object).length === 0;
  }
}
