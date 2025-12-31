import type { Serializable } from '../types/serializable.js';
import { SerializationError } from './errors.js';

/**
 * Checks if a value is a plain object (not a class instance, Map, Set, etc.)
 *
 * A value is considered a plain object if:
 * - It's created with {} literal
 * - It's created with Object.create(null)
 * - It's created with Object.create(someObject) where someObject is also plain
 *
 * Class instances (Date, Map, Error, custom classes) have their own constructor
 * property on their prototype, which distinguishes them from plain objects.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  let proto: object | null = Object.getPrototypeOf(value);

  // Walk up the prototype chain
  while (proto !== null) {
    // If we reach Object.prototype directly, it's a plain object
    if (proto === Object.prototype) {
      return true;
    }

    // Check if this prototype has its own constructor property
    // Class prototypes (Date.prototype, Map.prototype, etc.) define their own constructor
    // Plain objects inherit constructor from Object.prototype
    const hasOwnConstructor = Object.prototype.hasOwnProperty.call(proto, 'constructor');
    if (hasOwnConstructor) {
      const constructor = (proto as { constructor?: unknown }).constructor;
      if (typeof constructor === 'function' && constructor !== Object) {
        // This is a class prototype (e.g., Date.prototype, MyClass.prototype)
        return false;
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  // proto is null - this is Object.create(null) or similar
  return true;
}

/**
 * Gets a human-readable type description for error messages.
 */
function getTypeDescription(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  if (type === 'number') {
    const num = value as number;
    if (Number.isNaN(num)) return 'NaN';
    if (!Number.isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';
  }

  if (type === 'function') return 'function';
  if (type === 'symbol') return 'symbol';
  if (type === 'bigint') return 'bigint';

  if (type === 'object') {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'Date';
    if (value instanceof Map) return 'Map';
    if (value instanceof Set) return 'Set';
    if (value instanceof WeakMap) return 'WeakMap';
    if (value instanceof WeakSet) return 'WeakSet';
    if (value instanceof RegExp) return 'RegExp';
    if (value instanceof Promise) return 'Promise';
    if (value instanceof ArrayBuffer) return 'ArrayBuffer';
    if (value instanceof DataView) return 'DataView';
    if (ArrayBuffer.isView(value)) return value.constructor.name;
    if (value instanceof Error) return 'Error';

    const constructor = (value as object).constructor;
    if (constructor && constructor !== Object) {
      return `class instance (${constructor.name})`;
    }

    return 'object';
  }

  return type;
}

/**
 * Asserts that a value is serializable (can be safely converted to JSON).
 * 
 * Valid values: null, boolean, finite numbers, strings, arrays, plain objects
 * Invalid values: undefined, NaN, Infinity, functions, symbols, BigInt, Date,
 *                 class instances, Map, Set, RegExp, Promise, ArrayBuffer, TypedArrays
 * 
 * @param value - The value to validate
 * @param path - The path prefix for error reporting (default: "$")
 * @throws SerializationError if the value is not serializable
 */
export function assertSerializable(
  value: unknown,
  path: string = '$'
): asserts value is Serializable {
  // Use a Set to track visited objects for circular reference detection
  const visited = new Set<unknown>();
  assertSerializableInternal(value, path, visited);
}

function assertSerializableInternal(
  value: unknown,
  path: string,
  visited: Set<unknown>
): void {
  // Handle null
  if (value === null) {
    return;
  }

  // Handle undefined
  if (value === undefined) {
    throw new SerializationError(
      `Non-serializable value at ${path}: undefined is not allowed`,
      path,
      value
    );
  }

  const type = typeof value;

  // Handle boolean
  if (type === 'boolean') {
    return;
  }

  // Handle number
  if (type === 'number') {
    if (Number.isNaN(value)) {
      throw new SerializationError(
        `Non-serializable value at ${path}: NaN is not allowed`,
        path,
        value
      );
    }
    if (!Number.isFinite(value)) {
      throw new SerializationError(
        `Non-serializable value at ${path}: Infinity is not allowed`,
        path,
        value
      );
    }
    return;
  }

  // Handle string
  if (type === 'string') {
    return;
  }

  // Handle function
  if (type === 'function') {
    throw new SerializationError(
      `Non-serializable value at ${path}: function is not allowed`,
      path,
      value
    );
  }

  // Handle symbol
  if (type === 'symbol') {
    throw new SerializationError(
      `Non-serializable value at ${path}: symbol is not allowed`,
      path,
      value
    );
  }

  // Handle bigint
  if (type === 'bigint') {
    throw new SerializationError(
      `Non-serializable value at ${path}: bigint is not allowed`,
      path,
      value
    );
  }

  // Handle objects (arrays and plain objects)
  if (type === 'object') {
    // Check for circular reference
    if (visited.has(value)) {
      throw new SerializationError(
        `Non-serializable value at ${path}: circular reference detected`,
        path,
        value
      );
    }

    // Handle arrays
    if (Array.isArray(value)) {
      visited.add(value);
      for (let i = 0; i < value.length; i++) {
        // Check for sparse arrays (holes)
        if (!(i in value)) {
          throw new SerializationError(
            `Non-serializable value at ${path}[${i}]: undefined (sparse array) is not allowed`,
            `${path}[${i}]`,
            undefined
          );
        }
        assertSerializableInternal(value[i], `${path}[${i}]`, visited);
      }
      visited.delete(value);
      return;
    }

    // Reject non-plain objects
    if (!isPlainObject(value)) {
      const typeDesc = getTypeDescription(value);
      throw new SerializationError(
        `Non-serializable value at ${path}: ${typeDesc} is not allowed`,
        path,
        value
      );
    }

    // Handle plain objects - only check own enumerable properties
    visited.add(value);
    for (const key of Object.keys(value)) {
      const propValue = (value as Record<string, unknown>)[key];
      assertSerializableInternal(propValue, `${path}.${key}`, visited);
    }
    visited.delete(value);
    return;
  }

  // Unknown type (shouldn't happen, but be safe)
  throw new SerializationError(
    `Non-serializable value at ${path}: ${getTypeDescription(value)} is not allowed`,
    path,
    value
  );
}
