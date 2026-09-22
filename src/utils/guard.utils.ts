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
 * Determines whether a value is a non-null object.
 * Narrows the input type from `unknown` to `object` when the value
 * is an object and not `null`.
 * @param input Value to check.
 * @returns `true` when the value is a non-null object; otherwise `false`.
 */
export function isObject(input: unknown): input is Record<string, unknown> {
  return (
    input !== null && typeof input === "object" && input.constructor === Object
  );
}
