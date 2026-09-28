/**
 * @file file-operations.constant.ts
 * @description Named aliases for Node.js filesystem open flags, used when
 * opening the MiraKV storage file.
 */

/**
 * File-system open modes passed to `fs.open`.
 *
 * Each flag controls whether the file is read, written, created, or
 * truncated on open:
 *
 * - `READ` (`r`)         — read only; fails if the file does not exist.
 * - `READ_WRITE` (`r+`)  — read and write; fails if the file does not exist.
 * - `WRITE` (`w`)        — write only; creates the file, truncates if it exists.
 * - `WRITE_READ` (`w+`)  — read and write; creates the file, truncates if it exists.
 * - `APPEND` (`a`)       — append only; creates the file if it does not exist.
 * - `APPEND_READ` (`a+`) — read and append; creates the file if it does not exist.
 */
export const FILE_OPERATIONS = {
  READ: "r",
  READ_WRITE: "r+",
  WRITE: "w",
  WRITE_READ: "w+",
  APPEND: "a",
  APPEND_READ: "a+",
} as const;
