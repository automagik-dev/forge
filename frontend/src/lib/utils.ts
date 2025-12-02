import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deep equality comparison for objects and arrays.
 * Replaces lodash isEqual for simple use cases.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(key => isEqual(aObj[key], bObj[key]));
}

/**
 * Deep merge objects. Later sources override earlier ones.
 * Replaces lodash merge for simple use cases.
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  const result = structuredClone(target);

  for (const source of sources) {
    if (!source) continue;

    for (const key of Object.keys(source) as (keyof T)[]) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[keyof T];
      } else {
        result[key] = sourceValue as T[keyof T];
      }
    }
  }

  return result;
}
