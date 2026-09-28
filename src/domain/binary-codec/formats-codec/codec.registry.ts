import { BINARY_TYPE, ENCODING } from "../../constants/binary-types.constant";
import { ISerializer } from "../../interfaces/serializar.interface";
import { TBinaryValues, TEncodeValue } from "../../types/binary.types";
import { ArrayCodecSeriliazer } from "./object-codec/arrayCodec.serializer";
import { ObjectCodecSerializer } from "./object-codec/objectCodec.serializer";
import { BooleanCodecSerializer } from "./primitive-codecs/booleanCodec.serializer";
import { DateCodecSerializer } from "./primitive-codecs/dateCodec.serializer";
import { NumberCodecSerializer } from "./primitive-codecs/numberCodec.serializer";
import { StringCodecSerializer } from "./primitive-codecs/stringCodec.serializer";

/**
 * Returns the serializer responsible for a given binary type.
 * @param dataKind Binary type identifier.
 * @returns The serializer associated with the specified type.
 * @throws Error if no serializer is registered for the type.
 */
export function getCodec(dataKind: TBinaryValues): ISerializer {
  switch (dataKind) {
    case BINARY_TYPE.NUMBER:
      return new NumberCodecSerializer();
    case BINARY_TYPE.BOOLEAN:
      return new BooleanCodecSerializer();
    case BINARY_TYPE.STRING:
      return new StringCodecSerializer();
    case BINARY_TYPE.OBJECT:
      return new ObjectCodecSerializer();
    case BINARY_TYPE.DATE:
      return new DateCodecSerializer();
    case BINARY_TYPE.ARRAY:
      return new ArrayCodecSeriliazer();
    default:
      throw new Error();
  }
}

/**
 * Returns the binary encoding associated with a data type.
 * @param type Binary type identifier.
 * @returns Encoding identifier used to represent the type's payload.
 */
export function getTypeEncode(type: TBinaryValues): TEncodeValue {
  switch (type) {
    case BINARY_TYPE.NUMBER:
      return ENCODING.IEEE_754_BINARY64;
    case BINARY_TYPE.STRING:
      return ENCODING.UTF_8;
    case BINARY_TYPE.BOOLEAN:
      return ENCODING.BOOLEAN_8;
    case BINARY_TYPE.DATE:
      return ENCODING.UNIX_TIMESTAMP_MS;
    case BINARY_TYPE.ARRAY:
      return ENCODING.HOMOGENEOUS_ARRAY;
    default:
      return ENCODING.RESERVED;
  }
}

/**
 * Determines the MiraKV binary type associated with a JavaScript value.
 * @param record JavaScript value to inspect.
 * @returns The corresponding MiraKV binary type identifier.
 */
export function getTypeOf(record: unknown): TBinaryValues {
  if (record === null) return BINARY_TYPE.NULL;
  if (Array.isArray(record)) {
    return BINARY_TYPE.ARRAY;
  }
  if (record instanceof Date) {
    return BINARY_TYPE.DATE;
  }
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
