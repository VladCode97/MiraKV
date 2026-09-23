/**
 * @file constants.ts
 * @description Global constants shared across the MiraKV storage engine.
 */

/**
 * Maximum number of pages held in memory before a flush is required.
 * This is a provisional limit used during early development.
 *
 * @todo Replace with a configurable buffer pool size once the page
 * manager supports multi-page management.
 */
export const PAGE_LIMIT = 16;
