# Hash Table + AVL Tree

From-scratch implementation of a **hash map with automatic bucket migration** written in TypeScript. Inspired by the strategy introduced in Java `HashMap` (JDK 8), where high-collision buckets can be promoted from linked lists to a tree structure. This implementation uses an **AVL tree** — Java uses a red-black tree.

---

## Project structure

```
src/
├── data-structure/
│   ├── hash-table.ds.ts   # HashMap with automatic LinkedList ↔ AVLTree migration
│   ├── linked-list.ds.ts  # Singly linked list — default bucket
│   └── avl-tree.ds.ts     # Self-balancing AVL tree — promoted bucket
├── types/
│   ├── pair.type.ts        # TPair<K, V> — key-value pair
│   ├── avl.type.ts         # TBinaryNode, TDirectionImbalanceNode, TDirectionNode
│   └── user.type.ts        # TUser — example entity (smoke-test only)
├── utils/
│   └── guard.utils.ts      # Type-guards: isString, isNumber
└── index.ts                # Entry point / smoke-test
debug/                      # Local-only debug utilities (not tracked by git)
└── inspect.ts              # Bucket state visualizer
```

---

## How the migration works

Each bucket starts as a `LinkedList` (O(n) lookup). When a bucket reaches 6 elements and a 7th insert is attempted, the `HashMap` automatically migrates it to an `AVLTree` (O(log n) lookup). When enough elements are removed and the tree height drops to ≤ 1, the bucket is demoted back to a `LinkedList`.

```
bucket[1]:  [A] → [B] → [C] → [D] → [E] → [F]    ← LinkedList, 6 elements
                                                   ↓ 7th insert → promote
bucket[1]:  AVLTree (height 2) { A..G }            ← balanced tree
                                                   ↓ remove until height ≤ 1
bucket[1]:  [A] → [B] → null                       ← demoted back to LinkedList
```

The comparator required by the AVL tree is determined automatically at runtime from the key type via type guards — no external configuration needed.

---

## Implemented structures

### `HashMap<K, V>`

Generic hash map with **6 fixed buckets**. Supports `string` and `number` keys.

#### Public methods

| Method | Description |
|--------|-------------|
| `add(key, value)` | Computes the bucket index with `hash(key) % 6`. If the bucket does not exist, creates a `LinkedList` and appends the pair. If it exists and is a `LinkedList` with available capacity, appends directly. If the list is full (6 elements), migrates the bucket to `AVLTree` and then inserts. If the bucket is already an `AVLTree`, inserts directly into the tree. |
| `set(key, value)` | Locates the bucket by hash index. If `LinkedList`, calls `setElement` with a key predicate. If `AVLTree`, calls the tree's `set` which does an internal `search` and updates the value. |
| `get(key)` | Locates the bucket by hash index. If `LinkedList`, uses `findBy` with a predicate. If `AVLTree`, uses `search(key)` and builds the `TPair` return value. Returns `undefined` if not found. |
| `remove(key)` | Locates the bucket by hash index. If `LinkedList`, calls `findBy` then `remove(node.value)`. Deletes the slot if the bucket becomes empty. If `AVLTree`, calls `AVLTree.remove(key)`, then checks `shouldDemote()` — if `true`, demotes the bucket back to a `LinkedList` via `migrateToLinkedList`. |

#### Private methods

| Method | Description |
|--------|-------------|
| `hash(key)` | Converts the key to a number. For `string`, sums the UTF-16 char codes of each character. For `number`, uses the value directly. |
| `indexation(hash)` | Maps a hash value to a valid bucket index via `hash % bucket.length`. |
| `buildComparator(key)` | Determines and returns the comparator function based on the key type at runtime. `string` → `localeCompare`, `number` → subtraction. |
| `migrateToAVL(list, key)` | Traverses all nodes of the `LinkedList` and inserts them into a new `AVLTree`. Called by `add` when the list reaches capacity. |
| `migrateToLinkedList(tree)` | Traverses the `AVLTree` in-order and appends each pair to a new `LinkedList`. Called by `remove` when `shouldDemote()` returns `true`. |
| `inOrderList(node, list)` | Recursive in-order traversal (left → node → right) used by `migrateToLinkedList` to populate the list in ascending key order. |

---

### `AVLTree<K, V>`

Self-balancing binary search tree. After each insertion or deletion it updates node heights and applies the necessary rotation to keep the height difference between subtrees ≤ 1.

#### Public methods

| Method | Description |
|--------|-------------|
| `append(key, value)` | Public entry point for insertion. Delegates to `insert` and updates the root reference. |
| `search(key)` | Public entry point for lookup. Delegates to `searchElement` from the root. Returns the `TBinaryNode` or `null`. |
| `set(key, value)` | Finds the node with `searchElement` and directly updates its `value` if found. |
| `remove(key)` | Public entry point for deletion. Delegates to `removeElement` and updates the root reference. |
| `height(node?)` | Returns the height of the subtree rooted at `node`. Defaults to the tree root. Empty tree returns `-1`. |
| `shouldDemote()` | Returns `true` if `height() ≤ 1` — the tree is sparse enough to be demoted back to a `LinkedList`. Called by `HashMap.remove` after every deletion on an AVL bucket. |
| `Root` | Getter that exposes the root node for read-only access. Used by `HashMap.migrateToLinkedList` to traverse the tree. |

#### Private methods

| Method | Description |
|--------|-------------|
| `insert(node, key, value)` | Recursive BST insertion using the `comparator` on the key. On the way back up, delegates to `rebalance`. |
| `removeElement(node, key)` | Recursive BST deletion. Handles 3 cases: leaf node, one child, two children (in-order successor). Rebalances on the way back up. |
| `findMinimum(node)` | Finds the leftmost (smallest) node in a subtree. Used by `removeElement` to locate the in-order successor when deleting a node with two children. |
| `findMax(node)` | Finds the rightmost (largest) node in a subtree. Symmetric counterpart of `findMinimum`. |
| `rebalance(node)` | Updates the node's height, computes the balance factor, identifies the imbalance case (LL/LR/RR/RL), and applies the corresponding rotation. Shared by `insert` and `removeElement`. |
| `searchElement(node, key)` | Recursive BST lookup. Uses the `comparator` to decide whether to go left or right. Returns the node when `comparator === 0`. |
| `updateHeight(node)` | Recomputes and caches the node's height: `1 + max(left height, right height)`. |
| `getStoredHeight(node)` | Returns the cached height of the node, or `-1` if `null`. |
| `getBalanceFactor(node)` | Computes the balance factor: `height(left) - height(right)`. |
| `buildBalanceFactor(bf)` | Translates the balance factor number to `'LEFT'`, `'RIGHT'`, or `'BALANCED'`. |
| `calculateBalanceFactor(node, child)` | Combines the direction of the unbalanced node with that of its child to determine the exact case: `'LL'`, `'LR'`, `'RR'`, or `'RL'`. |
| `getDirectionNode(bf)` | Maps the sign of the balance factor to `'LEFT'`, `'RIGHT'`, or `'BALANCED'`. |
| `rotateRight(node)` | Single right rotation for the LL case. |
| `rotateLeft(node)` | Single left rotation for the RR case. |

**Rotation cases:**

| Case | Imbalance | Solution |
|------|-----------|----------|
| LL | Left-Left | `rotateRight(node)` |
| LR | Left-Right | `rotateLeft(node.left)` → `rotateRight(node)` |
| RR | Right-Right | `rotateLeft(node)` |
| RL | Right-Left | `rotateRight(node.right)` → `rotateLeft(node)` |

---

### `LinkedList<T>`

Singly linked list with a **maximum capacity of 6 nodes**. Used as the default bucket in the hash map.

#### Public methods

| Method | Description |
|--------|-------------|
| `append(value)` | Creates a `Node<T>` and adds it to the end. Initializes `head` and `tail` if the list is empty. Throws `Error` if `canAppendInList()` is `false`. |
| `setElement(value, predicate)` | Uses `findBy` internally to locate the first node matching the predicate and overwrites its `value`. No-op if no match is found. |
| `remove(value)` | Traverses the list looking for the node with that value. If it is the head, delegates to `shift()`. Otherwise, re-links the previous node to the next and adjusts `tail` if it was the last. |
| `findBy(predicate)` | Traverses from `head` and returns the first `Node<T>` whose `value` satisfies the predicate, or `null`. |
| `shift()` | Removes the head. Clears `head` and `tail` if it was the only node; otherwise advances `head` to the next. |
| `pop()` | Removes the tail. Clears `head` and `tail` if it was the only node; otherwise traverses to the second-to-last, makes it the new `tail`, and cuts the link. |
| `isEmpty()` | Returns `true` if `head === null`. |
| `canAppendInList()` | Returns `true` if `size < SIZE_LIMIT_LIST` (6). |

---

## Types

### `TPair<K, V>`
```ts
type TPair<K, V> = { key: K; value: V }
```
Element stored in each node of the linked list or tree inside a bucket.

### `TBinaryNode<K, V>`
```ts
type TBinaryNode<K, V> = {
  key: K                         // ordering key in the AVL tree
  value: V                       // associated value
  left: TBinaryNode<K, V> | null
  right: TBinaryNode<K, V> | null
  height: number                 // cached subtree height
}
```

### `TDirectionImbalanceNode`
```ts
type TDirectionImbalanceNode = 'LEFT' | 'RIGHT' | 'BALANCED'
```
Indicates the balance direction of a node: `LEFT`, `RIGHT`, or `BALANCED`.

### `TDirectionNode`
```ts
type TDirectionNode = 'LL' | 'LR' | 'RR' | 'RL'
```
Encodes the exact imbalance case to determine which rotation to apply.

---

## Utilities

### `guard.utils.ts`
Runtime type-guards for primitive type narrowing. Used by `hash` and `buildComparator` in `HashMap`.

```ts
isString(input)  // input is string
isNumber(input)  // input is number
```

---

## Debug inspector (local only)

`debug/inspect.ts` is excluded from git and provides a visual snapshot of the internal bucket state at any point. Useful for verifying migrations during development.

```ts
import { inspectBuckets } from '../debug/inspect.ts'
inspectBuckets(userDb)
```

Output example:

```
════════════════ HashMap Buckets ════════════════

bucket[1]: LinkedList
  [AAE] -> [AAK] -> [AAQ] -> [AAW] -> [AAc] -> [AAi] -> null

bucket[1]: AVLTree (height: 2)
  root
  ├── [AAK]
  │   ├── [AAE]
  │   └── [AAQ]
  └── ...

bucket[1]: LinkedList
  [AAE] -> [AAK] -> null

═════════════════════════════════════════════════
```

---

## Quick start

`HashMap` is agnostic to the value type — it accepts any `V`. The example below uses `TUser` to simulate an in-memory database, but `V` can be any type.

```ts
import { HashMap } from './data-structure/hash-table.ds.ts'

type TUser = {
  id: string
  name: string
  age: number
  genre: 'MALE' | 'FEMALE'
  createdAt: Date
}

const userDb = new HashMap<string, TUser>()

userDb.add('u-001', { id: 'u-001', name: 'Luis', age: 30, genre: 'MALE', createdAt: new Date() })
userDb.set('u-001', { id: 'u-001', name: 'Luis', age: 31, genre: 'MALE', createdAt: new Date() })

console.log(userDb.get('u-001'))  // { key: 'u-001', value: { ... } }

userDb.remove('u-001')
console.log(userDb.get('u-001'))  // undefined
```

```bash
npx tsx src/index.ts
```

---

## Roadmap

- [x] Singly linked list with maximum capacity
- [x] Hash map with separate chaining
- [x] AVL tree with all 4 rotation cases
- [x] Automatic `LinkedList → AVLTree` promotion per bucket
- [x] Automatic comparator inference from key type at runtime
- [x] `AVLTree.remove(key)` with rebalancing
- [x] `HashMap.remove` on AVL buckets
- [x] Automatic `AVLTree → LinkedList` demotion when height ≤ 1
- [x] Local debug inspector (`debug/inspect.ts`)
- [ ] Unit tests
