import { BinaryCodecManager } from "../domain/binary-codec/BinaryCodecManager.serializer";
import { TRecordLocation } from "../domain/types/page.type";
import { AVLTree } from "../index/AVL/avl-tree.ds";
import { PageManager } from "../storage/page/page-manager";

/**
 * A typed collection of records backed by MiraKV storage.
 *
 * Each collection owns its own {@link PageManager}, binary serializer, and
 * {@link AVLTree} index, so different collections (e.g. users, products)
 * remain isolated with independent storage and indexing.
 *
 * @typeParam T - The record type stored in this collection.
 *
 * @example
 * const users = new Collection<TUser>();
 * await users.insert(user, user.doc);
 * const found = await users.findById(user.doc);
 */
export class Collection<T> {
  /** Manages the physical page layout and persistence for this collection. */
  private pageManager: PageManager;
  /** Serializer used to encode records into the MiraKV binary format. */
  private binaryCodecManager: BinaryCodecManager;
  /** In-memory index mapping record keys to their physical location. */
  private avlTree: AVLTree<string, TRecordLocation>;

  constructor() {
    this.binaryCodecManager = new BinaryCodecManager();
    this.avlTree = new AVLTree<string, TRecordLocation>((a, b) =>
      a.localeCompare(b),
    );
    this.pageManager = new PageManager(this.binaryCodecManager, this.avlTree);
  }

  /**
   * Inserts a record into the collection under the given key.
   *
   * @param record - The record to store.
   * @param key    - The key used to index and later retrieve the record.
   */
  async insert(record: T, key: string): Promise<void> {
    await this.pageManager.initialize();
    this.pageManager.appendRecord(record, key);
    await this.pageManager.close();
  }

  /**
   * Retrieves every record currently stored in the collection's page.
   */
  async find() {
    this.pageManager.getPage();
  }

  /**
   * Retrieves a single record by its key.
   *
   * @param key - The key of the record to look up.
   * @returns The record cast to `T`, or an empty object if not found.
   */
  async findById(key: string): Promise<T> {
    return this.pageManager.findId(key) as T;
  }
}
