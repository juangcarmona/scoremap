export function requireValue(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}
export function object(
  value: unknown,
  keys: string[],
  optional: string[] = [],
): asserts value is Record<string, unknown> {
  requireValue(
    typeof value === "object" && value !== null && !Array.isArray(value),
    "Expected an object.",
  );
  const actual = Object.keys(value);
  requireValue(
    keys.every((k) => actual.includes(k)) &&
      actual.every((k) => keys.includes(k) || optional.includes(k)),
    "Missing or unexpected data fields.",
  );
}
export function text(value: unknown): asserts value is string {
  requireValue(typeof value === "string", "Expected text.");
}
export function name(value: unknown): asserts value is string {
  text(value);
  requireValue(value.trim().length > 0, "A name or title is required.");
}
export function array(value: unknown): asserts value is unknown[] {
  requireValue(Array.isArray(value), "Expected a list.");
}
export function sameData(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object")
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) =>
        Object.hasOwn(right, key) &&
        sameData(
          (left as Record<string, unknown>)[key],
          (right as Record<string, unknown>)[key],
        ),
    )
  );
}
