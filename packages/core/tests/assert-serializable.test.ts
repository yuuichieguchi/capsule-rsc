/**
 * Test suite for assertSerializable function
 *
 * Coverage:
 * - Valid serializable values (primitives, arrays, plain objects)
 * - Invalid non-serializable values (undefined, functions, symbols, etc.)
 * - Deeply nested structures
 * - Path tracking for error reporting
 */

import { describe, it, expect } from 'vitest';
import { assertSerializable, SerializationError } from '../src/index.js';

describe('assertSerializable', () => {
  // ==================== Valid Serializable Values ====================

  describe('valid serializable values', () => {
    describe('null', () => {
      it('should accept null', () => {
        expect(() => assertSerializable(null)).not.toThrow();
      });
    });

    describe('boolean', () => {
      it('should accept true', () => {
        expect(() => assertSerializable(true)).not.toThrow();
      });

      it('should accept false', () => {
        expect(() => assertSerializable(false)).not.toThrow();
      });
    });

    describe('finite numbers', () => {
      it('should accept positive integer', () => {
        expect(() => assertSerializable(42)).not.toThrow();
      });

      it('should accept negative float', () => {
        expect(() => assertSerializable(-3.14)).not.toThrow();
      });

      it('should accept zero', () => {
        expect(() => assertSerializable(0)).not.toThrow();
      });

      it('should accept negative zero', () => {
        expect(() => assertSerializable(-0)).not.toThrow();
      });

      it('should accept Number.MAX_VALUE', () => {
        expect(() => assertSerializable(Number.MAX_VALUE)).not.toThrow();
      });

      it('should accept Number.MIN_VALUE', () => {
        expect(() => assertSerializable(Number.MIN_VALUE)).not.toThrow();
      });
    });

    describe('strings', () => {
      it('should accept empty string', () => {
        expect(() => assertSerializable('')).not.toThrow();
      });

      it('should accept non-empty string', () => {
        expect(() => assertSerializable('hello')).not.toThrow();
      });

      it('should accept unicode string', () => {
        expect(() => assertSerializable('日本語 🎉')).not.toThrow();
      });

      it('should accept string with special characters', () => {
        expect(() => assertSerializable('\n\t\r\0')).not.toThrow();
      });
    });

    describe('arrays', () => {
      it('should accept empty array', () => {
        expect(() => assertSerializable([])).not.toThrow();
      });

      it('should accept array with mixed serializable values', () => {
        expect(() => assertSerializable([1, 'two', null, true])).not.toThrow();
      });

      it('should accept nested arrays', () => {
        expect(() => assertSerializable([[1, 2], [3, [4, 5]]])).not.toThrow();
      });

      it('should accept array with objects', () => {
        expect(() => assertSerializable([{ a: 1 }, { b: 2 }])).not.toThrow();
      });
    });

    describe('plain objects', () => {
      it('should accept empty object', () => {
        expect(() => assertSerializable({})).not.toThrow();
      });

      it('should accept object with primitive values', () => {
        expect(() => assertSerializable({ a: 1, b: 'two', c: null, d: true })).not.toThrow();
      });

      it('should accept object with array values', () => {
        expect(() => assertSerializable({ items: [1, 2, 3] })).not.toThrow();
      });

      it('should accept object created with Object.create(null)', () => {
        const obj = Object.create(null) as Record<string, unknown>;
        obj.key = 'value';
        expect(() => assertSerializable(obj)).not.toThrow();
      });
    });

    describe('deeply nested structures', () => {
      it('should accept complex nested object', () => {
        const deeplyNested = {
          a: [
            {
              b: {
                c: [1, 2, { d: 'deep' }],
              },
            },
          ],
        };
        expect(() => assertSerializable(deeplyNested)).not.toThrow();
      });

      it('should accept deeply nested arrays', () => {
        const deepArray = [[[[[[1, 2, 3]]]]]];
        expect(() => assertSerializable(deepArray)).not.toThrow();
      });

      it('should accept mixed deep nesting', () => {
        const mixed = {
          level1: {
            level2: [
              {
                level3: {
                  level4: [null, true, 'string', 42],
                },
              },
            ],
          },
        };
        expect(() => assertSerializable(mixed)).not.toThrow();
      });
    });
  });

  // ==================== Invalid Non-Serializable Values ====================

  describe('invalid non-serializable values', () => {
    describe('undefined', () => {
      it('should throw SerializationError for undefined', () => {
        expect(() => assertSerializable(undefined)).toThrow(SerializationError);
      });
    });

    describe('special number values', () => {
      it('should throw SerializationError for NaN', () => {
        expect(() => assertSerializable(NaN)).toThrow(SerializationError);
      });

      it('should throw SerializationError for Infinity', () => {
        expect(() => assertSerializable(Infinity)).toThrow(SerializationError);
      });

      it('should throw SerializationError for -Infinity', () => {
        expect(() => assertSerializable(-Infinity)).toThrow(SerializationError);
      });
    });

    describe('functions', () => {
      it('should throw SerializationError for arrow function', () => {
        expect(() => assertSerializable(() => {})).toThrow(SerializationError);
      });

      it('should throw SerializationError for regular function', () => {
        expect(() => assertSerializable(function test() {})).toThrow(SerializationError);
      });

      it('should throw SerializationError for async function', () => {
        expect(() => assertSerializable(async () => {})).toThrow(SerializationError);
      });

      it('should throw SerializationError for generator function', () => {
        expect(() => assertSerializable(function* gen() {})).toThrow(SerializationError);
      });
    });

    describe('symbols', () => {
      it('should throw SerializationError for Symbol()', () => {
        expect(() => assertSerializable(Symbol())).toThrow(SerializationError);
      });

      it('should throw SerializationError for Symbol.for()', () => {
        expect(() => assertSerializable(Symbol.for('test'))).toThrow(SerializationError);
      });
    });

    describe('BigInt', () => {
      it('should throw SerializationError for BigInt', () => {
        expect(() => assertSerializable(BigInt(123))).toThrow(SerializationError);
      });

      it('should throw SerializationError for BigInt literal', () => {
        expect(() => assertSerializable(9007199254740991n)).toThrow(SerializationError);
      });
    });

    describe('Date objects', () => {
      it('should throw SerializationError for Date', () => {
        expect(() => assertSerializable(new Date())).toThrow(SerializationError);
      });

      it('should throw SerializationError for Date with specific value', () => {
        expect(() => assertSerializable(new Date('2024-01-01'))).toThrow(SerializationError);
      });
    });

    describe('class instances', () => {
      it('should throw SerializationError for custom class instance', () => {
        class MyClass {
          value = 1;
        }
        expect(() => assertSerializable(new MyClass())).toThrow(SerializationError);
      });

      it('should throw SerializationError for Error instance', () => {
        expect(() => assertSerializable(new Error('test'))).toThrow(SerializationError);
      });
    });

    describe('Map', () => {
      it('should throw SerializationError for empty Map', () => {
        expect(() => assertSerializable(new Map())).toThrow(SerializationError);
      });

      it('should throw SerializationError for Map with entries', () => {
        expect(() => assertSerializable(new Map([['key', 'value']]))).toThrow(SerializationError);
      });
    });

    describe('Set', () => {
      it('should throw SerializationError for empty Set', () => {
        expect(() => assertSerializable(new Set())).toThrow(SerializationError);
      });

      it('should throw SerializationError for Set with values', () => {
        expect(() => assertSerializable(new Set([1, 2, 3]))).toThrow(SerializationError);
      });
    });

    describe('RegExp', () => {
      it('should throw SerializationError for RegExp literal', () => {
        expect(() => assertSerializable(/test/)).toThrow(SerializationError);
      });

      it('should throw SerializationError for RegExp constructor', () => {
        expect(() => assertSerializable(new RegExp('test', 'g'))).toThrow(SerializationError);
      });
    });

    describe('Promise', () => {
      it('should throw SerializationError for Promise.resolve()', () => {
        expect(() => assertSerializable(Promise.resolve())).toThrow(SerializationError);
      });

      it('should throw SerializationError for new Promise', () => {
        expect(() => assertSerializable(new Promise(() => {}))).toThrow(SerializationError);
      });
    });

    describe('ArrayBuffer and TypedArrays', () => {
      it('should throw SerializationError for ArrayBuffer', () => {
        expect(() => assertSerializable(new ArrayBuffer(8))).toThrow(SerializationError);
      });

      it('should throw SerializationError for Uint8Array', () => {
        expect(() => assertSerializable(new Uint8Array(8))).toThrow(SerializationError);
      });

      it('should throw SerializationError for Int32Array', () => {
        expect(() => assertSerializable(new Int32Array(8))).toThrow(SerializationError);
      });

      it('should throw SerializationError for Float64Array', () => {
        expect(() => assertSerializable(new Float64Array(8))).toThrow(SerializationError);
      });

      it('should throw SerializationError for DataView', () => {
        expect(() => assertSerializable(new DataView(new ArrayBuffer(8)))).toThrow(
          SerializationError
        );
      });
    });

    describe('WeakMap and WeakSet', () => {
      it('should throw SerializationError for WeakMap', () => {
        expect(() => assertSerializable(new WeakMap())).toThrow(SerializationError);
      });

      it('should throw SerializationError for WeakSet', () => {
        expect(() => assertSerializable(new WeakSet())).toThrow(SerializationError);
      });
    });
  });

  // ==================== Nested Invalid Values ====================

  describe('nested invalid values', () => {
    it('should throw for undefined in object', () => {
      expect(() => assertSerializable({ a: undefined })).toThrow(SerializationError);
    });

    it('should throw for function in object', () => {
      expect(() => assertSerializable({ fn: () => {} })).toThrow(SerializationError);
    });

    it('should throw for undefined in array', () => {
      expect(() => assertSerializable([1, 2, undefined])).toThrow(SerializationError);
    });

    it('should throw for symbol in nested object', () => {
      expect(() => assertSerializable({ a: { b: Symbol() } })).toThrow(SerializationError);
    });

    it('should throw for Date in deeply nested structure', () => {
      expect(() =>
        assertSerializable({
          a: {
            b: [{ c: new Date() }],
          },
        })
      ).toThrow(SerializationError);
    });
  });

  // ==================== Path Tracking ====================

  describe('path tracking in error messages', () => {
    it('should report path for undefined in nested object', () => {
      expect(() =>
        assertSerializable({
          a: {
            b: [1, 2, undefined],
          },
        })
      ).toThrow(/\$\.a\.b\[2\]/);
    });

    it('should report path for root level invalid value', () => {
      expect(() => assertSerializable(undefined)).toThrow(/\$/);
    });

    it('should report path for first-level property', () => {
      expect(() => assertSerializable({ invalid: Symbol() })).toThrow(/\$\.invalid/);
    });

    it('should report path for array index', () => {
      expect(() => assertSerializable([1, 2, NaN, 4])).toThrow(/\$\[2\]/);
    });

    it('should report path for deeply nested value', () => {
      expect(() =>
        assertSerializable({
          level1: {
            level2: {
              level3: [{ level4: () => {} }],
            },
          },
        })
      ).toThrow(/\$\.level1\.level2\.level3\[0\]\.level4/);
    });

    it('should use custom path prefix when provided', () => {
      expect(() => assertSerializable({ x: undefined }, 'customRoot')).toThrow(
        /customRoot\.x/
      );
    });

    it('should handle object keys with special characters in path', () => {
      expect(() => assertSerializable({ 'key-with-dash': undefined })).toThrow(SerializationError);
    });
  });

  // ==================== SerializationError Class ====================

  describe('SerializationError', () => {
    it('should be instance of Error', () => {
      try {
        assertSerializable(undefined);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e).toBeInstanceOf(SerializationError);
      }
    });

    it('should have meaningful error message', () => {
      try {
        assertSerializable(undefined);
      } catch (e) {
        expect((e as Error).message).toContain('undefined');
      }
    });

    it('should include path in error message', () => {
      try {
        assertSerializable({ a: { b: NaN } });
      } catch (e) {
        expect((e as Error).message).toContain('$.a.b');
      }
    });

    it('should include value type in error message', () => {
      try {
        assertSerializable(() => {});
      } catch (e) {
        expect((e as Error).message).toMatch(/function/i);
      }
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle empty sparse array', () => {
      // eslint-disable-next-line no-sparse-arrays
      const sparse = [, , ,];
      expect(() => assertSerializable(sparse)).toThrow(SerializationError);
    });

    it('should handle array with hole', () => {
      const arr = [1, 2, 3];
      delete (arr as unknown as Record<number, unknown>)[1];
      expect(() => assertSerializable(arr)).toThrow(SerializationError);
    });

    it('should handle object with inherited properties', () => {
      const parent = { inherited: 'value' };
      const child = Object.create(parent) as Record<string, unknown>;
      child.own = 'property';
      // Should only check own properties
      expect(() => assertSerializable(child)).not.toThrow();
    });

    it('should handle object with non-enumerable properties', () => {
      const obj = { visible: 'yes' };
      Object.defineProperty(obj, 'hidden', {
        value: Symbol(),
        enumerable: false,
      });
      // Should only check enumerable properties
      expect(() => assertSerializable(obj)).not.toThrow();
    });

    it('should handle circular reference detection gracefully', () => {
      const circular: Record<string, unknown> = { a: 1 };
      circular.self = circular;
      // Implementation should either throw SerializationError or handle gracefully
      expect(() => assertSerializable(circular)).toThrow();
    });

    it('should handle very deeply nested structure', () => {
      let deep: unknown = null;
      for (let i = 0; i < 100; i++) {
        deep = { nested: deep };
      }
      expect(() => assertSerializable(deep)).not.toThrow();
    });

    it('should handle very long array', () => {
      const longArray = Array.from({ length: 10000 }, (_, i) => i);
      expect(() => assertSerializable(longArray)).not.toThrow();
    });
  });
});
