import { BINARY_TYPE, ENCODING } from "../constants/binary-types.constant";

/**
 * Binary type identifiers defined by the MiraKV binary format.
 * Represents the semantic type of a serialized value.
 */
export type TBinaryValues = (typeof BINARY_TYPE)[keyof typeof BINARY_TYPE];
/**
 * Encoding identifiers defined by the MiraKV binary format.
 * Represents how the payload bytes are encoded.
 */
export type TEncodeValue = (typeof ENCODING)[keyof typeof ENCODING];
