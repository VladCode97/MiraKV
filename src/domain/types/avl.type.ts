/**
 * @file avl.type.ts
 * @description Type definitions for the AVL tree nodes and balance directions.
 */

/**
 * Represents a single node in an AVL binary search tree.
 *
 * @template K - The type of the key used for ordering and lookup.
 * @template V - The type of the value stored in the node.
 */
export type TBinaryNode<K, V> = {
  /** The key used to order the node within the tree. Comparisons are performed on this field. */
  key: K
  /** The value associated with the key. */
  value: V
    /** Left child node, or `null` if absent. */
    left: TBinaryNode<K, V> | null
    /** Right child node, or `null` if absent. */
    right: TBinaryNode<K, V> | null
    /**
     * Cached height of this node's subtree.
     * A leaf node has height `0`; `null` nodes are treated as `-1`.
     */
    height: number
}

/**
 * Describes which side of a node is heavier, or whether it is balanced.
 *
 * - `'LEFT'`     — balance factor > 1  (left-heavy, needs right rotation)
 * - `'RIGHT'`    — balance factor < -1 (right-heavy, needs left rotation)
 * - `'BALANCED'` — balance factor in [-1, 1] (no rotation needed)
 */
export type TDirectionImbalanceNode = 'LEFT' | 'RIGHT' | 'BALANCED'

/**
 * Encodes the four possible imbalance cases that determine which
 * rotation strategy to apply.
 *
 * - `'LL'` — Left-Left   → single right rotation
 * - `'LR'` — Left-Right  → left rotation on child, then right rotation on node
 * - `'RR'` — Right-Right → single left rotation
 * - `'RL'` — Right-Left  → right rotation on child, then left rotation on node
 */
export type TDirectionNode = 'LL' | 'LR' | 'RR' | 'RL'
