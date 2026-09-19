/**
 * @file user.type.ts
 * @description Type definitions for the User entity.
 */

/** Allowed gender values for a user. */
export type TGenre = 'MALE' | 'FEMALE'

/**
 * Represents a user record stored in the hash map.
 *
 * @example
 * const user: TUser = {
 *   id: 'u-001',
 *   name: 'Luis',
 *   age: 30,
 *   genre: 'MALE',
 *   createdAt: new Date(),
 * }
 */
export type TUser = {
  /** Unique identifier for the user. */
  id: string
  /** Full name of the user. */
  name: string
  /** Age of the user in years. */
  age: number
  /** Gender of the user. */
  genre: TGenre
  /** Timestamp when the record was created. */
  createdAt: Date
}
