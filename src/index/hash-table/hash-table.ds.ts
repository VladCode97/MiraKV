/**
 * @file hash-table.ds.ts
 * @description Generic hash map implementation that uses separate chaining
 * via {@link AVLTree} to resolve collisions within each bucket.
 */

import { TPair } from "../../domain/types/pair.type";
import { isNumber, isString } from "../../utils/guard.utils";
import { AVLTree } from "../AVL/avl-tree.ds";

/**
 * A generic hash map that stores key-value pairs.
 *
 * Keys are hashed into a fixed-size bucket array. Each bucket is an
 * {@link AVLTree}, giving O(log n) lookup, insertion, and deletion within
 * a bucket and making the structure resilient to hash collisions.
 * Currently supports `string` and `number` keys.
 *
 * @template K - The type of the keys (must be `string` or `number`).
 * @template V - The type of the values.
 *
 * @example
 * const map = new HashMap<string, number>();
 * map.add('score', 42);
 * map.set('score', 99);
 * map.get('score'); // { key: 'score', value: 99 }
 */
export class HashMap<K, V> {
  /**
   * Internal array of buckets. Each occupied slot holds an {@link AVLTree}
   * that stores all pairs whose keys hash to that index.
   */
  private bucket: Array<AVLTree<K, V> | undefined>;

  /** Fixed number of buckets in the hash table. */
  private readonly BUCKET_COUNT: number;

  constructor() {
    this.BUCKET_COUNT = 6;
    this.bucket = new Array<AVLTree<K, V> | undefined>(this.BUCKET_COUNT);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Inserts a new key-value pair into the hash table.
   *
   * If the target bucket is empty a new {@link AVLTree} is created for it.
   * The pair is then inserted via {@link AVLTree.append}.
   *
   * @param key   - The key used to identify the value.
   * @param value - The value associated with the key.
   */
  public add(key: K, value: V): void {
    const index = this.bucketIndex(key);
    if (!this.bucket[index]) {
      this.bucket[index] = new AVLTree<K, V>(this.buildComparator(key));
    }
    this.bucket[index]!.append(key, value);
  }

  /**
   * Updates the value associated with an existing key.
   *
   * If the key is not present in the table, the call is a no-op.
   *
   * @param key   - The key whose value should be updated.
   * @param value - The new value to associate with the key.
   */
  public set(key: K, value: V): void {
    const tree = this.bucket[this.bucketIndex(key)];
    if (tree) {
      tree.set(key, value);
    }
  }

  /**
   * Retrieves the key-value pair associated with a given key.
   *
   * @param key - The key to search for.
   * @returns The matching {@link TPair} if found; otherwise `undefined`.
   */
  public get(key: K): TPair<K, V> | undefined {
    const tree = this.bucket[this.bucketIndex(key)];
    if (!tree) return undefined;
    const pair = tree.search(key);
    if (pair === null) return undefined;
    return pair;
  }

  /**
   * Removes the key-value pair associated with the given key.
   *
   * Delegates to {@link AVLTree.remove}. If the bucket's tree becomes
   * empty after the removal, the bucket slot is cleared.
   *
   * Does nothing if the key is not present in the table.
   *
   * @param key - The key of the pair to remove.
   */
  public remove(key: K): void {
    const index = this.bucketIndex(key);
    const tree = this.bucket[index];
    if (tree) {
      tree.remove(key);
      if (tree.Root === null) {
        this.bucket[index] = undefined;
      }
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Computes the bucket index for a given key by combining the hash
   * function with modulo arithmetic.
   *
   * @param key - The key to map to a bucket.
   * @returns A bucket index in the range `[0, BUCKET_COUNT)`.
   */
  private bucketIndex(key: K): number {
    return this.hash(key) % this.BUCKET_COUNT;
  }

  /**
   * Generates a numeric hash from the given key.
   *
   * - **string**: sums the UTF-16 char codes of every character.
   * - **number**: used as-is (absolute value to keep the index positive).
   *
   * @param key - The key to hash. Must be a `string` or `number`.
   * @returns The numeric hash value.
   * @throws {Error} If the key type is not supported.
   */
  private hash(key: K): number {
    if (isString(key)) {
      return [...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    } else if (isNumber(key)) {
      return Math.abs(key);
    } else {
      throw new Error("ERROR: unsupported key type");
    }
  }

  /**
   * Returns a comparator function for the given key type, used when
   * constructing a new {@link AVLTree} bucket.
   *
   * - `string` → `localeCompare`
   * - `number` → subtraction
   *
   * @param key - A sample key used to detect the runtime type.
   * @returns A comparator compatible with {@link AVLTree}.
   * @throws {Error} If the key type is not supported.
   */
  private buildComparator(key: K): (a: K, b: K) => number {
    if (isString(key)) {
      return (a, b) => (a as string).localeCompare(b as string);
    } else if (isNumber(key)) {
      return (a, b) => (a as number) - (b as number);
    } else {
      throw new Error("ERROR: unsupported key type for AVLTree comparator");
    }
  }
}
