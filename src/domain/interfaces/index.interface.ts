import { TPair } from "../types/pair.type";

/**
 * Defines the basic operations supported by a MiraKV index.
 *
 * @typeParam K Type of the index key.
 * @typeParam V Type of the indexed value.
 */
export interface IIndex<K, V> {
  /**
   * Appends a key-value pair to the index.
   */
  append(key: K, value: V): void;
  /**
   * Inserts or updates a key-value pair.
   */
  set(key: K, value: V): void;
  /**
   * Removes a key from the index.
   */
  remove(key: K): void;
  /**
   * Searches for a key in the index.
   *
   * @returns The associated key-value pair, or null if not found.
   */
  search(key: K): TPair<K, V> | null;
}
