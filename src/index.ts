/**
 * @file index.ts
 * @description Entry point — basic usage example of {@link HashMap}.
 */

import { HashMap } from "./index/hash-table/hash-table.ds";
import { BinaryCodecManager } from "./domain/binary-codec/BinaryCodecManager.serializer";
import { PageManager } from "./storage/page/page-manager";
import { AVLTree } from "./index/AVL/avl-tree.ds";

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

const user_: TUser = {
  name: "Judith",
  doc: "128358",
  number: "+54 1084",
};

export type TRecordLocation = {
  pageId: number;
  slotId: number;
};

/**
 * Structure index of AVL
 */
const indexAVL: AVLTree<string, TRecordLocation> = new AVLTree<
  string,
  TRecordLocation
>((a, b) => a.localeCompare(b));

const pageManager: PageManager = new PageManager(
  new BinaryCodecManager(),
  indexAVL,
);
pageManager.appendRecord(user, user.doc);
pageManager.appendRecord(user_, user_.doc);

(async () => {
  const user = await pageManager.findId("O-EXISTE");
  console.log(user);
})();
