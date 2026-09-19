/**
 * @file pair.type.ts
 * @description Shared type definitions for key-value pair structures.
 */

/**
 * Represents a generic key-value pair.
 *
 * Used as the element type stored inside each {@link LinkedList} bucket
 * of the {@link HashMap}.
 *
 * @template K - The type of the key.
 * @template V - The type of the value.
 *
 * @example
 * const pair: TPair<string, number> = { key: 'age', value: 30 };
 */
export type TPair<K, V> = {
  key: K,
  value: V
}
