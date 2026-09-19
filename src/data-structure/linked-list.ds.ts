/**
 * @file linked-list.ds.ts
 * @description Singly linked list implementation used as the underlying
 * chaining structure for the hash table buckets.
 */

/**
 * Represents a single node in a singly linked list.
 *
 * @template T - The type of value stored in the node.
 */
export class Node<T> {
  /** The value held by this node. */
  public value: T

  /** Reference to the next node, or `null` if this is the tail. */
  public next: Node<T> | null

  /**
   * Creates a new node with the given value.
   *
   * @param value - The value to store in the node.
   */
  constructor(value: T) {
    this.value = value
    this.next = null
  }
}

/**
 * A generic singly linked list with a fixed capacity.
 *
 * Nodes are chained from head to tail. The list enforces a maximum
 * size (`SIZE_LIMIT_LIST`) to keep bucket chains bounded.
 *
 * @template T - The type of elements stored in the list.
 */
export class LinkedList<T> {
  /** First node of the list, or `null` when empty. */
  private head: Node<T> | null

  /** Last node of the list, or `null` when empty. */
  private tail: Node<T> | null

  /** Current number of elements in the list. */
  public size: number

  /** Maximum number of elements the list can hold. */
  private readonly SIZE_LIMIT_LIST: number

  constructor() {
    this.head = null
    this.tail = null
    this.size = 0
    this.SIZE_LIMIT_LIST = 6
  }

  /**
   * Appends a new element to the end of the list.
   *
   * @param value - The value to append.
   * @throws {Error} If the list has reached its maximum capacity.
   */
  public append(value: T): void {
    const node: Node<T> = new Node<T>(value)
    if (this.head === null || this.tail === null) {
      this.head = node
      this.tail = node
      this.size += 1
    } else {
      if (this.canAppendInList()) {
        this.tail.next = node
        this.tail = node
        this.size += 1
      } else {
        throw new Error('Can not append')
      }
    }
  }

  /**
   * Updates the value of the first node that satisfies the given predicate.
   * Does nothing if no matching node is found.
   *
   * @param value     - The new value to set.
   * @param predicate - Function that returns `true` for the node to update.
   */
  public setElement(value: T, predicate: (element: T) => boolean): void {
    const existElement = this.findBy(predicate)
    if (existElement === null) { return }
    existElement.value = value
  }

  /**
   * Removes the first node whose value strictly equals `value`.
   *
   * @param value - The value to remove.
   * @returns `true` if a node was removed; `false` if not found.
   */
  public remove(value: T): boolean {
    if (this.head === null) {
      return false
    }
    if (this.head.value === value) {
      this.shift()
      return true
    }
    let prevNode: Node<T> = this.head
    let currentNode: Node<T> | null = this.head.next
    while (currentNode !== null) {
      if (currentNode.value === value) {
        prevNode.next = currentNode.next
        if (currentNode === this.tail) {
          this.tail = prevNode
        }
        this.size -= 1
        return true
      }
      prevNode = currentNode
      currentNode = currentNode.next
    }
    return false
  }

  /**
   * Checks whether the list contains no elements.
   *
   * @returns `true` if the list is empty; otherwise `false`.
   */
  public isEmpty(): boolean {
    return this.head === null
  }

  /**
   * Finds the first node that satisfies the given predicate.
   *
   * @param predicate - Function that returns `true` for the desired node.
   * @returns The first matching node, or `null` if none is found.
   */
  public findBy(predicate: (value: T) => boolean): Node<T> | null {
    let currentNode = this.head
    while (currentNode !== null) {
      if (predicate(currentNode.value)) {
        return currentNode
      }
      currentNode = currentNode.next
    }
    return null
  }

  /**
   * Removes the first (head) element of the list.
   * Does nothing if the list is empty.
   */
  public shift(): void {
    if (this.isEmpty()) return
    if (this.head && this.head?.next === null) {
      this.head = null
      this.tail = null
      this.size = 0
    } else {
      const temporalNode = this.head?.next
      this.head = temporalNode as Node<T>
      this.size -= 1
    }
  }

  /**
   * Removes the last (tail) element of the list.
   * Does nothing if the list is empty.
   */
  public pop(): void {
    if (this.isEmpty()) { return }
    if (this.head?.next === null) {
      this.head = null
      this.tail = null
      this.size = 0
    } else {
      let currentNode: Node<T> = this.head as Node<T>
      if (currentNode === null) return
      while (currentNode.next) {
        if (currentNode.next === this.tail) {
          currentNode.next = null
          this.tail = currentNode
          this.size -= 1
          break
        } else {
          currentNode = currentNode.next
        }
      }
    }
  }

  /**
   * Indicates whether a new element can be appended without exceeding the
   * list's capacity.
   *
   * @returns `true` if there is still room; otherwise `false`.
   */
  public canAppendInList(): boolean {
    return this.size !== this.SIZE_LIMIT_LIST
  }

  public get Head(): Node<T> | null {
    return this.head
  }
}
