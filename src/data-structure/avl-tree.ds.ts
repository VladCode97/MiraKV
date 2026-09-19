/**
 * @file avl-tree.ds.ts
 * @description Self-balancing AVL binary search tree.
 *
 * After every insertion the tree rebalances itself using single or double
 * rotations so that the height difference between any node's left and right
 * subtrees never exceeds 1. This guarantees O(log n) search, insert, and
 * delete operations.
 */

import { TBinaryNode, TDirectionImbalanceNode, TDirectionNode } from '../types/avl.type'

/**
 * A generic self-balancing AVL binary search tree that stores key-value pairs.
 *
 * Ordering is based on `key` using the native `<` / `>` operators, so `K`
 * should be a comparable type (e.g. `number`, `string`).
 *
 * @template K - The type of the keys used for ordering and lookup.
 * @template V - The type of the values associated with each key.
 */
export class AVLTree<K, V> {
    /** Root node of the tree, or `null` when the tree is empty. */
    private root: TBinaryNode<K, V> | null

    /**
     * Function used to compare two keys.
     * Must return a negative number if `a < b`, a positive number if `a > b`,
     * or `0` if they are equal.
     *
     * @example
     * // number keys
     * (a, b) => a - b
     * // string keys
     * (a, b) => a.localeCompare(b)
     */
    private comparator: (a: K, b: K) => number

    constructor(comparator: (a: K, b: K) => number) {
        this.root = null
        this.comparator = comparator
    }

    /**
     * Public entry point to insert a key-value pair into the tree.
     * Delegates to {@link insert} and updates the root reference.
     *
     * @param key   - The key used to order the node in the tree.
     * @param value - The value to associate with the key.
     */
    public append(key: K, value: V): void {
        this.root = this.insert(this.root, key, value)
    }

    /**
     * Public entry point to search for a node by key.
     * Delegates to {@link searchElement} starting from the root.
     *
     * @param key - The key to look up.
     * @returns The matching {@link TBinaryNode} if found; otherwise `null`.
     */
    public search(key: K): TBinaryNode<K, V> | null {
        return this.searchElement(this.root, key)
    }


    /**
     * Updates the value associated with an existing key.
     * Uses {@link searchElement} to locate the node and overwrites its value in place.
     * Does nothing if the key is not found.
     *
     * @param key   - The key of the node to update.
     * @param value - The new value to assign.
     */
    public set(key: K, value: V): void {
        const element = this.searchElement(this.root, key)
        if (element !== null) {
            element.value = value
        }
    }

    /**
     * Computes the height of the subtree rooted at `node`.
     *
     * Height is defined as the number of edges on the longest path from
     * the node down to a leaf. An empty tree (`null`) has height `-1`,
     * and a single-node tree has height `0`.
     *
     * Defaults to the tree's root when called without arguments, so
     * `tree.height()` returns the overall height of the tree.
     * Used by {@link HashMap} to decide whether to demote an AVL bucket
     * back to a {@link LinkedList} when the tree becomes sparse after removals.
     *
     * @param node - The subtree root to measure. Defaults to `this.root`.
     * @returns The height of the subtree, or `-1` if `node` is `null`.
     */
    public height(node: TBinaryNode<K, V> | null = this.root): number {
        if (node === null) { return -1 }
        else {
            return 1 + this.max(this.height(node.left), this.height(node.right))
        }
    }

    /**
     * Returns `true` when the tree is sparse enough to be demoted back to a
     * {@link LinkedList} bucket. The threshold is `height <= 1`, which covers
     * trees with 3 or fewer nodes — small enough that O(n) list traversal
     * is cheaper than maintaining the tree overhead.
     *
     * Called by {@link HashMap.remove} after every deletion on an AVL bucket.
     *
     * @returns `true` if the tree should be demoted; otherwise `false`.
     */
    public shouldDemote(): boolean {
        return this.height() <= 1;
    }

    /**
     * Exposes the root node of the tree for read-only access.
     * Used by {@link HashMap.migrateToLinkedList} to traverse the tree
     * without breaking encapsulation beyond a controlled getter.
     *
     * @returns The root {@link TBinaryNode}, or `null` if the tree is empty.
     */
    public get Root(): TBinaryNode<K, V> | null {
        return this.root
    }



    /**
     * Recursively inserts a key-value pair into the subtree rooted at `node`,
     * then rebalances the subtree if needed.
     *
     * Steps:
     * 1. Standard BST insertion — position determined by {@link comparator} on `key`.
     * 2. Update the node's cached height.
     * 3. Compute the balance factor.
     * 4. Apply the appropriate rotation (LL / LR / RR / RL) if unbalanced.
     *
     * @param node  - The current subtree root (may be `null` for an empty slot).
     * @param key   - The key used to determine the insertion position.
     * @param value - The value to store at the new node.
     * @returns The new root of the (possibly rotated) subtree.
     */
    private insert(node: TBinaryNode<K, V> | null, key: K, value: V): TBinaryNode<K, V> | null {
        if (node === null) {
            return {
                key,
                value,
                left: null,
                right: null,
                height: 0
            }
        } else {
            const comparator = this.comparator(key, node.key)
            if (comparator < 0) {
                node.left = this.insert(node.left, key, value)
            } else if (comparator > 0) {
                node.right = this.insert(node.right, key, value)
            }
            return this.rebalance(node)
        }
    }

    /**
     * Public entry point to remove a node by key.
     * Delegates to {@link removeElement} and updates the root reference.
     *
     * @param key - The key of the node to remove.
     */
    public remove(key: K): void {
        this.root = this.removeElement(this.root, key)
    }

    /**
     * Recursively traverses the tree to find and remove the node matching `key`,
     * then rebalances the subtree on the way back up via {@link rebalance}.
     *
     * Three cases when the target node is found (`comparator === 0`):
     * 1. **Leaf node** — return `null` to detach it.
     * 2. **One child** — return the existing child to replace the node.
     * 3. **Two children** — find the in-order successor (smallest node in the
     *    right subtree), copy its key/value into the current node, then
     *    recursively remove the successor from the right subtree.
     *
     * @param node - The current subtree root being examined.
     * @param key  - The key to remove.
     * @returns The new subtree root after removal and rebalancing.
     */
    private removeElement(node: TBinaryNode<K, V> | null, key: K): TBinaryNode<K, V> | null {
        if (node === null) { return null }
        else {
            const comparator = this.comparator(key, node.key)
            if (comparator < 0) {
                node.left = this.removeElement(node.left, key)
            } else if (comparator > 0) {
                node.right = this.removeElement(node.right, key)
            } else {
                if (node.left === null && node.right === null) {
                    return null
                } else if (node.left === null || node.right === null) {
                    if (node.left !== null) {
                        return node.left
                    }
                    if (node.right !== null) {
                        return node.right
                    }
                } else {
                    let successor = this.findMinimum(node.right)
                    if (successor === null) {
                        return node
                    }
                    node.key = successor.key
                    node.value = successor.value
                    node.right = this.removeElement(node.right, successor.key)
                }
            }
            return this.rebalance(node)
        }
    }

    /**
     * Recursively finds the node with the smallest key in the given subtree
     * by following left children until reaching a node with no left child.
     *
     * Used by {@link removeElement} to locate the in-order successor when
     * deleting a node with two children — the successor is the minimum of
     * the right subtree.
     *
     * @param node - The root of the subtree to search.
     * @returns The leftmost node in the subtree, or `null` if `node` is `null`.
     */
    private findMinimum(node: TBinaryNode<K, V> | null): TBinaryNode<K, V> | null {
        if (node === null) return null
        if (node.left === null) { return node }
        else {
            return this.findMinimum(node.left)
        }
    }

    /**
     * Recursively finds the node with the largest key in the given subtree
     * by following right children until reaching a node with no right child.
     *
     * Symmetric counterpart of {@link findMinimum}. Useful for locating the
     * in-order predecessor when an alternative deletion strategy is needed.
     *
     * @param node - The root of the subtree to search.
     * @returns The rightmost node in the subtree, or `null` if `node` is `null`.
     */
    private findMax(node: TBinaryNode<K, V> | null): TBinaryNode<K, V> | null {
        if (node === null) return null
        if (node.right === null) { return node }
        else {
            return this.findMax(node.right)
        }
    }

    /**
     * Checks and restores the AVL balance property of a node after an
     * insertion or deletion.
     *
     * Steps:
     * 1. Update the node's cached height.
     * 2. Compute the balance factor.
     * 3. Determine the imbalance direction (`LEFT` or `RIGHT`).
     * 4. Identify the exact case (LL / LR / RR / RL) and apply the rotation.
     *
     * Extracted from {@link insert} so it can be reused by {@link removeElement}.
     *
     * @param node - The node to rebalance.
     * @returns The new subtree root after rebalancing, or the same node if
     *          it was already balanced.
     */
    private rebalance(node: TBinaryNode<K, V>): TBinaryNode<K, V> | null {
        this.updateHeight(node)
        const balanceFactor = this.getBalanceFactor(node)
        const direction = this.buildBalanceFactor(balanceFactor)
        if (direction === 'LEFT') {
            const type = this.calculateBalanceFactor(node, node.left)
            if (type === 'LL') {
                return this.rotateRight(node)
            } else if (type === 'LR') {
                node.left = this.rotateLeft(node.left)
                return this.rotateRight(node)
            }
        } else if (direction === 'RIGHT') {
            const type = this.calculateBalanceFactor(node, node.right)
            if (type === 'RR') {
                return this.rotateLeft(node)
            } else if (type === 'RL') {
                node.right = this.rotateRight(node.right)
                return this.rotateLeft(node)
            }
        }
        return node
    }

    /**
     * Recursively traverses the tree to find the node matching `key`.
     * Uses the {@link comparator} to decide whether to go left or right
     * at each step, guaranteeing O(log n) lookup.
     *
     * @param node - The current subtree root being examined.
     * @param key  - The key to search for.
     * @returns The matching node if found; otherwise `null`.
     */
    private searchElement(node: TBinaryNode<K, V> | null, key: K): TBinaryNode<K, V> | null {
        if (node === null) return null
        else {
            const comparator = this.comparator(key, node.key)
            if (comparator === 0) return node
            if (comparator < 0) return this.searchElement(node.left, key)
            if (comparator > 0) return this.searchElement(node.right, key)
            return null
        }
    }

    /**
     * Recalculates and stores the height of a node based on its children.
     * Height = 1 + max(leftHeight, rightHeight). Leaf nodes get height `0`.
     *
     * @param node - The node whose height should be updated.
     */
    private updateHeight(node: TBinaryNode<K, V> | null): void {
        if (node === null) return
        node.height = 1 + this.max(this.getStoredHeight(node.left), this.getStoredHeight(node.right))
    }

    /**
     * Returns the cached height of a node, treating `null` as `-1`
     * so that leaf nodes produce a height of `0` after `1 + (-1)`.
     *
     * @param node - The node to read the height from.
     * @returns The node's height, or `-1` if the node is `null`.
     */
    private getStoredHeight(node: TBinaryNode<K, V> | null): number {
        return node === null ? -1 : node.height
    }

    /**
     * Returns the larger of two numbers. Thin wrapper around `Math.max`.
     *
     * @param nodeLeftValue  - Height of the left subtree.
     * @param nodeRightValue - Height of the right subtree.
     * @returns The greater value.
     */
    private max(nodeLeftValue: number, nodeRightValue: number): number {
        return Math.max(nodeLeftValue, nodeRightValue)
    }

    /**
     * Computes the balance factor of a node.
     * Balance factor = height(left) − height(right).
     *
     * - Positive → left-heavy
     * - Negative → right-heavy
     * - Zero     → perfectly balanced
     *
     * @param node - The node to evaluate.
     * @returns The balance factor, or `0` for a `null` node.
     */
    private getBalanceFactor(node: TBinaryNode<K, V> | null): number {
        if (node === null) { return 0 }
        return this.getStoredHeight(node.left) - this.getStoredHeight(node.right)
    }

    /**
     * Translates a raw balance-factor number into a {@link TDirectionImbalanceNode}
     * indicating which side is heavy enough to require a rotation.
     *
     * @param bfValue - The balance factor value.
     * @returns `'LEFT'` if > 1, `'RIGHT'` if < -1, `'BALANCED'` otherwise.
     */
    private buildBalanceFactor(bfValue: number): TDirectionImbalanceNode {
        if (bfValue > 1) {
            return 'LEFT'
        } else if (bfValue < -1) {
            return 'RIGHT'
        } else {
            return 'BALANCED'
        }
    }

    /**
     * Determines the specific imbalance case ({@link TDirectionNode}) by
     * combining the direction of the unbalanced node with the direction
     * of its relevant child.
     *
     * @param node      - The unbalanced node.
     * @param childNode - The heavy child (left or right, depending on direction).
     * @returns One of `'LL'`, `'LR'`, `'RR'`, or `'RL'`.
     */
    private calculateBalanceFactor(node: TBinaryNode<K, V> | null, childNode: TBinaryNode<K, V> | null): TDirectionNode {
        const nodeDirection = this.getDirectionNode(this.getBalanceFactor(node))[0]
        const childNodeDirection = this.getDirectionNode(this.getBalanceFactor(childNode))[0]
        return nodeDirection + childNodeDirection as TDirectionNode
    }

    /**
     * Maps a balance factor to a single-character direction label used
     * when building the imbalance case string.
     *
     * @param bfValue - The balance factor of a node.
     * @returns `'LEFT'` if positive, `'RIGHT'` if negative, `'BALANCED'` if zero.
     */
    private getDirectionNode(bfValue: number): TDirectionImbalanceNode {
        const direction = Math.sign(bfValue)
        if (direction === 1) {
            return 'LEFT'
        }
        if (direction === -1) {
            return 'RIGHT'
        }
        return 'BALANCED'
    }

    /**
     * Performs a right rotation around `node` to fix a Left-Left imbalance.
     *
     * ```
     *     node              child
     *    /    \            /     \
     *  child   Z   →      X     node
     *  /   \                   /    \
     * X   subtree          subtree   Z
     * ```
     *
     * Heights of `node` and `child` are updated after the rotation.
     *
     * @param node - The unbalanced node to rotate around.
     * @returns The new subtree root (`child`), or `null` if rotation is not possible.
     */
    private rotateRight(node: TBinaryNode<K, V> | null): TBinaryNode<K, V> | null {
        if (node === null) return null
        let child = node.left
        if (child === null) return null
        let subtree = child.right
        child.right = node
        node.left = subtree
        this.updateHeight(node)
        this.updateHeight(child)
        return child
    }

    /**
     * Performs a left rotation around `node` to fix a Right-Right imbalance.
     *
     * ```
     *   node                child
     *  /    \              /     \
     * Z    child   →    node      X
     *      /   \        /  \
     *  subtree  X      Z  subtree
     * ```
     *
     * Heights of `node` and `child` are updated after the rotation.
     *
     * @param node - The unbalanced node to rotate around.
     * @returns The new subtree root (`child`), or `null` if rotation is not possible.
     */
    private rotateLeft(node: TBinaryNode<K, V> | null): TBinaryNode<K, V> | null {
        if (node === null) return null
        let child = node.right
        if (child === null) return null
        let subtree = child.left
        child.left = node
        node.right = subtree
        this.updateHeight(node)
        this.updateHeight(child)
        return child
    }
}
