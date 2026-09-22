/**
 * @file index.ts
 * @description Entry point — basic usage example of {@link HashMap}.
 */

import { BINARY_TYPE } from "./domain/constants/binary-types.constant";
import { HashMap } from "./index/hash-table/hash-table.ds";
import { BinaryCodecManager } from "./domain/binary-codec/BinaryCodecManager.serializer";

type TCollection<K, V> = {
  name: string;
  operation: HashMap<K, V>;
};

type TUser = {
  name: string;
  doc: string;
  number: string;
};

const user: TUser = {
  name: "Luis",
  doc: "89104952452",
  number: "+54 3084",
};

const binaryCodec = new BinaryCodecManager();
const buffer = binaryCodec.serialize(user);
console.log(buffer);
console.log(binaryCodec.deserialize(buffer));
