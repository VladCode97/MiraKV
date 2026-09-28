/**
 * @file guard.utils.ts
 * @description Type-guard utilities used to narrow unknown values to
 * primitive types at runtime.
 */

/**
 * Checks whether `input` is a `string`.
 *
 * @param input - The value to test.
 * @returns `true` and narrows the type to `string` if the check passes.
 */
export function isString(input: unknown): input is string {
  return typeof input === "string";
}

/**
 * Checks whether `input` is a `number`.
 *
 * @param input - The value to test.
 * @returns `true` and narrows the type to `number` if the check passes.
 */
export function isNumber(input: unknown): input is number {
  return typeof input === "number";
}

/**
 * Checks whether `input` is a non-null plain JavaScript object.
 *
 * Arrays are excluded — only `typeof input === 'object'` values that
 * are not `null` and not arrays pass this guard. Used by
 * {@link ObjectCodecSerializer} to validate records before serialization.
 *
 * @param input - The value to test.
 * @returns `true` and narrows the type to `Record<string, unknown>` if the check passes.
 */
export function isObject(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

/**
 * Checks whether `input` is a non-empty array whose elements are all
 * primitives of the same type (`string`, `number`, or `boolean`).
 *
 * "Homogeneous" means every element shares the type of the first element.
 * Empty arrays, nested arrays, objects, and mixed-type arrays all fail.
 * Used by {@link ArrayCodecSeriliazer} to decide whether an array can be
 * serialized with the compact homogeneous-array layout.
 *
 * @param value - The value to test.
 * @returns `true` and narrows to `(string | number | boolean)[]` if every
 *          element is a primitive of the same type.
 */
export function isHomogeneousPrimitiveArray(
  value: unknown,
): value is (string | number | boolean)[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  const type = typeof value[0];
  if (type !== "string" && type !== "number" && type !== "boolean") {
    return false;
  }
  return value.every((item) => typeof item === type);
}
