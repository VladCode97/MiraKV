import { TBinaryValues, TEncodeValue } from "../types/binary.types";

/**
 * Builds binary envelopes for MiraKV serialized values.
 *
 * An envelope contains the metadata required to interpret a payload:
 *
 * [version][type][length][payload][encoding]
 */
export class BinaryEnvelope {
  private static binaryEnvelope: BinaryEnvelope;
  private constructor() {}

  /**
   * Returns the shared BinaryEnvelope instance.
   *
   * @returns The singleton BinaryEnvelope instance.
   */
  static get Instance(): BinaryEnvelope {
    if (BinaryEnvelope.binaryEnvelope === undefined) {
      BinaryEnvelope.binaryEnvelope = new BinaryEnvelope();
    }
    return BinaryEnvelope.binaryEnvelope;
  }

  /**
   * Builds a binary envelope for a serialized payload.
   *
   * The envelope follows the MiraKV binary layout:
   *
   * [version][type][length][payload][encoding]
   *
   * - version: 1 byte
   * - type: 1 byte
   * - length: 4 bytes
   * - payload: variable-length binary data
   * - encoding: 1 byte
   *
   * @param version Binary format version.
   * @param type Binary type identifier of the payload.
   * @param payload Serialized payload.
   * @param encoding Encoding identifier used to interpret the payload.
   * @returns A Buffer containing the complete binary envelope.
   */
  public envelope(
    version: number,
    type: TBinaryValues,
    payload: Buffer,
    encoding: TEncodeValue,
  ) {
    const envelopeBuffer = Buffer.alloc(7 + payload.byteLength);
    const metadataBuffer = envelopeBuffer.subarray(0, 6);
    metadataBuffer.writeUInt8(version, 0);
    metadataBuffer.writeUInt8(type, 1);
    metadataBuffer.writeUInt32LE(payload.byteLength, 2);
    const payloadBuffer = envelopeBuffer.subarray(6, 6 + payload.byteLength);
    payload.copy(payloadBuffer);
    const encodingBuffer = envelopeBuffer.subarray(
      6 + payload.byteLength,
      6 + payload.byteLength + 1,
    );
    encodingBuffer.writeUInt8(encoding, 0);
    return envelopeBuffer;
  }
}
