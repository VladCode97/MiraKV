/**
 * @file page.util.ts
 * @description Monotonically increasing ID allocators for pages and slots.
 *
 * @todo Persist the last allocated ID to disk so IDs remain unique
 * across process restarts.
 */

/**
 * Returns a closure that produces a monotonically increasing integer
 * starting at 0. Each call to the returned function increments and
 * returns the internal counter.
 *
 * Used to allocate unique identifiers for pages and slots within the
 * current process lifetime.
 *
 * @returns A function that returns the next integer ID on each call.
 */
function generateData(): () => number {
  let count: number = -1;
  return function () {
    count += 1;
    return count;
  };
}

/**
 * Allocates a unique page identifier.
 * IDs are sequential and start at 0.
 * Each call returns the next available page ID.
 */
const pageIdAllocatorUtil = generateData();

/**
 * Allocates a unique slot identifier within the current page.
 * IDs are sequential and start at 0.
 * Each call returns the next available slot ID.
 */
const slotIdAllocatorUtil = generateData();

export { pageIdAllocatorUtil, slotIdAllocatorUtil };
