/**
 * Native JavaScript alternatives to lodash object utilities.
 * These reduce bundle size by ~40KB compared to importing from lodash.
 */

/**
 * Deep equality comparison between two values.
 * Handles primitives, arrays, objects, Date, RegExp, Map, Set.
 * Protects against circular references using a WeakMap.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return isEqualWithTracking(a, b, new WeakMap());
}

function isEqualWithTracking(
  a: unknown,
  b: unknown,
  visited: WeakMap<object, object>
): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  // Circular reference protection
  if (visited.has(a as object)) {
    return visited.get(a as object) === b;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    visited.set(a as object, b as object);
  }

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // Handle Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key) || !isEqualWithTracking(val, b.get(key), visited))
        return false;
    }
    return true;
  }

  // Handle Set - use deep equality for set values
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    const aArr = Array.from(a);
    const bArr = Array.from(b);
    // For each value in a, find a deeply equal value in b
    for (const aVal of aArr) {
      const found = bArr.some((bVal) => isEqualWithTracking(aVal, bVal, visited));
      if (!found) return false;
    }
    return true;
  }

  // Handle Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqualWithTracking(a[i], b[i], visited)) return false;
    }
    return true;
  }

  // Handle plain objects
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
    if (!isEqualWithTracking(aObj[key], bObj[key], visited)) return false;
  }

  return true;
}

/**
 * Deep clone an object using the native structuredClone API.
 * This is the standard way to deep clone objects in modern browsers.
 */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

/**
 * Check if a value is a plain object (not an array, null, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep merge multiple objects into a new object.
 * Later objects take precedence over earlier ones.
 * Arrays are replaced, not merged.
 * Protects against circular references using a WeakMap.
 */
export function deepMerge<T extends Record<string, unknown>>(
  ...objects: (Partial<T> | undefined | null)[]
): T {
  return deepMergeWithTracking(new WeakMap(), ...objects) as T;
}

function deepMergeWithTracking<T extends Record<string, unknown>>(
  visited: WeakMap<object, object>,
  ...objects: (Partial<T> | undefined | null)[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    if (!obj) continue;

    // Circular reference protection
    if (visited.has(obj)) {
      return visited.get(obj) as Record<string, unknown>;
    }
    visited.set(obj, result);

    for (const key of Object.keys(obj)) {
      const targetVal = result[key];
      const sourceVal = obj[key];

      if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
        result[key] = deepMergeWithTracking(
          visited,
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>
        );
      } else {
        result[key] = sourceVal;
      }
    }
  }

  return result;
}
