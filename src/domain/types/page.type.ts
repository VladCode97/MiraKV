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
