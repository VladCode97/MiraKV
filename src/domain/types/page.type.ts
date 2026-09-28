/**
 * @file page.type.ts
 * @description Type definitions describing MiraKV pages, their slot metadata,
 * and how records are located within the storage file.
 */

/**
 * Metadata describing the physical location of a record within a page.
 */
export type TSlots = {
  /**
   * Byte offset where the record begins.
   */
  offset: number;
  /**
   * Size of the record in bytes.
   */
  length: number;
};

/**
 * Logical representation of a MiraKV page.
 *
 * A page contains record location metadata, stored records,
 * available free space, and the position from which records grow.
 */
export type TPage = {
  /**
   * Unique identifier of the page.
   */
  id: number;
  /**
   * Slot metadata used to locate records within the page.
   */
  slots: TSlots[];
  /**
   * Records stored in the page.
   */
  record: unknown[];
  /**
   * Available contiguous free space in the page, in bytes.
   */
  freeSpace: number;
  /**
   * Byte offset where the record area begins.
   */
  recordStart: number;
};

/**
 * Locates a record in the storage file by page and slot.
 *
 * Stored as the value in the {@link AVLTree} index: a key resolves to a
 * `TRecordLocation`, which is then used to read the target page and slot
 * from disk. The record's byte `offset` and `length` live in the slot
 * itself, so only the page and slot identifiers are needed here.
 */
export type TRecordLocation = {
  /** Identifier of the page that contains the record. */
  pageId: number;
  /** Identifier of the slot within the page that points to the record. */
  slotId: number;
};
