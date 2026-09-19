/**
 * @file hash-table.ds.ts
 * @description Generic hash map implementation that uses separate chaining
 * (via {@link LinkedList}) to resolve collisions.
 */

import { TPair } from '../types/pair.type';
import { LinkedList } from './linked-list.ds';
import { isNumber, isString } from '../utils/guard.utils';
import { AVLTree } from './avl-tree.ds';
import { TBinaryNode } from '../types/avl.type';

/**
 * A generic hash map that stores key-value pairs.
 *
 * Keys are hashed into a fixed-size bucket array. Collisions are handled
 * through separate chaining using a {@link LinkedList} per bucket.
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
   * Internal array of buckets. Each slot starts as a {@link LinkedList}
   * and is promoted to an {@link AVLTree} once the list reaches capacity.
   */
  private bucket: Array<LinkedList<TPair<K, V>> | AVLTree<K, V>>

  /** Fixed number of buckets in the hash table. */
  private LIMIT_LENGTH_BUCKET: number;

  constructor() {
    this.LIMIT_LENGTH_BUCKET = 6
    this.bucket = new Array<LinkedList<TPair<K, V>>>(this.LIMIT_LENGTH_BUCKET);
  }

  /**
   * Inserts a new key-value pair into the hash table.
   *
   * If the bucket is empty, a new {@link LinkedList} is created.
   * If the list is full, it is migrated to an {@link AVLTree} and the
   * new pair is inserted into the tree instead.
   *
   * @param key   - The key used to identify the value.
   * @param value - The value associated with the key.
   */
  public add(key: K, value: V): void {
    const hashIndex = this.indexation(this.hash(key))
    if (!this.bucket[hashIndex]) {
      const linkedList = new LinkedList<TPair<K, V>>()
      linkedList.append({ key, value })
      this.bucket[hashIndex] = linkedList;
    } else {
      if (this.bucket[hashIndex] instanceof AVLTree) {
        this.bucket[hashIndex].append(key, value)
      } else {
        const canAppendInList = this.bucket[hashIndex].canAppendInList()
        if (canAppendInList === false) {
          const tree = this.migrateToAVL(this.bucket[hashIndex] as LinkedList<TPair<K, V>>, key)
          tree.append(key, value)
          this.bucket[hashIndex] = tree
        } else {
          this.bucket[hashIndex].append({ key, value })
        }
      }
    }
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
    const hashIndex = this.indexation(this.hash(key))
    if (this.bucket[hashIndex]) {
      if (this.bucket[hashIndex] instanceof AVLTree) {
        this.bucket[hashIndex].set(key, value)
      } else {
        this.bucket[hashIndex].setElement({ key, value }, (pair) => pair.key === key)
      }
    }
  }

  /**
   * Retrieves the key-value pair associated with a given key.
   *
   * @param key - The key to search for.
   * @returns The matching {@link TPair} if found; otherwise `undefined`.
   */
  public get(key: K): TPair<K, V> | undefined {
    const hashIndex = this.indexation(this.hash(key))
    if (!this.bucket[hashIndex]) {
      return undefined
    }
    if (this.bucket[hashIndex] instanceof AVLTree) {
      const node = this.bucket[hashIndex].search(key)
      if (node === null) return undefined
      return { key: node.key, value: node.value }
    } else {
      const node = this.bucket[hashIndex].findBy((pair) => pair.key === key)
      return node?.value
    }
  }

  /**
   * Removes the key-value pair associated with the given key.
   *
   * - If the bucket is a {@link LinkedList}, finds the node and removes it.
   *   Deletes the bucket slot if the list becomes empty.
   * - If the bucket is an {@link AVLTree}, delegates to {@link AVLTree.remove},
   *   then checks {@link AVLTree.shouldDemote}. If the tree has become sparse
   *   (height ≤ 1), the bucket is demoted back to a {@link LinkedList} via
   *   {@link migrateToLinkedList}.
   *
   * Does nothing if the key is not present in the table.
   *
   * @param key - The key of the pair to remove.
   */
  public remove(key: K): void {
    const hashIndex = this.indexation(this.hash(key))
    if (this.bucket[hashIndex]) {
      if ((this.bucket[hashIndex] instanceof AVLTree)) {
        this.bucket[hashIndex].remove(key);
        if ((this.bucket[hashIndex] as AVLTree<K, V>).shouldDemote()) {
          this.bucket[hashIndex] = this.migrateToLinkedList(this.bucket[hashIndex] as AVLTree<K, V>)
        }
      } else {
        const node = (this.bucket[hashIndex] as LinkedList<TPair<K, V>>).findBy((pair) => pair.key === key)
        if (node !== null) {
          (this.bucket[hashIndex] as LinkedList<TPair<K, V>>).remove(node.value)
          if ((this.bucket[hashIndex] as LinkedList<TPair<K, V>>).isEmpty()) {
            delete this.bucket[hashIndex]
          }
        }
      }
    }
  }

  /**
   * Maps a raw hash value to a valid bucket index using modulo arithmetic.
   *
   * @param input - The raw hash value.
   * @returns A bucket index in the range `[0, bucket.length)`.
   */
  private indexation(input: number): number {
    return input % this.bucket.length
  }

  /**
   * Generates a numeric hash from the given key.
   *
   * - **string**: sums the UTF-16 char codes of every character.
   * - **number**: used as-is.
   *
   * @param key - The key to hash. Must be a `string` or `number`.
   * @returns The numeric hash value.
   * @throws {Error} If the key type is not supported.
   */
  private hash(key: K): number {
    if (isString(key)) {
      return [...key].map((e) => e.charCodeAt(0)).reduce((x, y) => x + y)
    } else if (isNumber(key)) {
      return key
    } else {
      throw new Error('ERROR: invalid type')
    }
  }


  /**
   * Infers and returns the appropriate comparator function based on the
   * runtime type of the key. Used internally when migrating a bucket to
   * an {@link AVLTree}.
   *
   * - `string` → `localeCompare`
   * - `number` → subtraction
   *
   * @param key - A sample key used to detect the type.
   * @returns A comparator function compatible with {@link AVLTree}.
   * @throws {Error} If the key type is not supported.
   */
  private buildComparator(key: K): (a: K, b: K) => number {
    if (isString(key)) {
      return (a, b) => (a as string).localeCompare(b as string)
    } else if (isNumber(key)) {
      return (a, b) => (a as number) - (b as number)
    } else {
      throw new Error('ERROR: unsupported key type for AVLTree comparator')
    }
  }

  /**
   * Migrates a full {@link LinkedList} bucket to a new {@link AVLTree}.
   *
   * Traverses every node in the list and inserts its key-value pair into
   * the tree in order. The comparator is determined at runtime via
   * {@link buildComparator} using the triggering key's type.
   * Called by {@link add} when a bucket reaches its maximum list capacity.
   *
   * @param list - The linked list bucket to migrate.
   * @param key  - The key that triggered the migration, used to infer the comparator.
   * @returns A new {@link AVLTree} containing all elements from the list.
   */
  private migrateToAVL(list: LinkedList<TPair<K, V>>, key: K): AVLTree<K, V> {
    const tree = new AVLTree<K, V>(this.buildComparator(key))
    let head = list.Head
    while (head !== null) {
      tree.append(head.value.key, head.value.value)
      head = head.next
    }
    return tree
  }

  /**
   * Migrates a sparse {@link AVLTree} bucket back to a {@link LinkedList}.
   *
   * Called by {@link remove} when {@link AVLTree.shouldDemote} returns `true`.
   * Delegates the traversal to {@link inOrderList}, which visits every node
   * in ascending key order and appends each pair to the new list.
   *
   * @param tree - The AVL tree bucket to demote.
   * @returns A new {@link LinkedList} containing all elements from the tree.
   */
  private migrateToLinkedList(tree: AVLTree<K, V>): LinkedList<TPair<K, V>> {
    const list = new LinkedList<TPair<K, V>>()
    this.inOrderList(tree.Root, list)
    return list
  }

  /**
   * Recursively traverses a subtree in-order (left → node → right) and
   * appends each key-value pair to `list`.
   *
   * In-order traversal on a BST visits nodes in ascending key order, so
   * the resulting list is sorted — consistent with the original insertion
   * order in the tree.
   *
   * @param node - The current subtree root being visited.
   * @param list - The list to append each pair to.
   */
  private inOrderList(node: TBinaryNode<K, V> | null, list: LinkedList<TPair<K, V>>): void {
    if (node === null) return
    this.inOrderList(node.left, list)
    list.append({ key: node.key, value: node.value })
    this.inOrderList(node.right, list)
  }


}
