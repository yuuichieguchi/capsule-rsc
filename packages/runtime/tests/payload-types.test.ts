/**
 * Test suite for SerializablePayload type structure
 *
 * Coverage:
 * - Type structure validation
 * - Type guard functions
 * - Payload shape correctness
 *
 * Note: These tests verify the runtime type checking behavior,
 * not TypeScript compile-time types.
 */

import { describe, it, expect } from 'vitest';
import {
  isSerializablePayload,
  type SerializablePayload,
} from '../src/index.js';

describe('SerializablePayload', () => {
  // ==================== Type Structure ====================

  describe('type structure validation', () => {
    describe('valid payloads', () => {
      it('should accept minimal valid payload with only required fields', () => {
        const payload: SerializablePayload = {
          type: 'Component',
          props: {},
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept payload with string type and primitive props', () => {
        const payload: SerializablePayload = {
          type: 'UserCard',
          props: { name: 'John', age: 30, active: true },
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept payload with nested object props', () => {
        const payload: SerializablePayload = {
          type: 'Profile',
          props: {
            user: {
              name: 'Alice',
              email: 'alice@example.com',
            },
          },
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept payload with array props', () => {
        const payload: SerializablePayload = {
          type: 'List',
          props: {
            items: ['a', 'b', 'c'],
            counts: [1, 2, 3],
          },
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept payload with null props values', () => {
        const payload: SerializablePayload = {
          type: 'NullableField',
          props: {
            value: null,
            data: { nested: null },
          },
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept payload with empty children array', () => {
        const payload: SerializablePayload = {
          type: 'Container',
          props: {},
          children: [],
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept payload with single child', () => {
        const payload: SerializablePayload = {
          type: 'Parent',
          props: { title: 'Parent' },
          children: [
            {
              type: 'Child',
              props: { label: 'First Child' },
            },
          ],
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept payload with multiple children', () => {
        const payload: SerializablePayload = {
          type: 'Container',
          props: {},
          children: [
            { type: 'Item', props: { id: 1 } },
            { type: 'Item', props: { id: 2 } },
            { type: 'Item', props: { id: 3 } },
          ],
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });

      it('should accept deeply nested children', () => {
        const payload: SerializablePayload = {
          type: 'Root',
          props: {},
          children: [
            {
              type: 'Level1',
              props: {},
              children: [
                {
                  type: 'Level2',
                  props: {},
                  children: [
                    {
                      type: 'Level3',
                      props: { depth: 3 },
                    },
                  ],
                },
              ],
            },
          ],
        };

        expect(isSerializablePayload(payload)).toBe(true);
      });
    });

    describe('invalid payloads', () => {
      it('should reject null', () => {
        expect(isSerializablePayload(null)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(isSerializablePayload(undefined)).toBe(false);
      });

      it('should reject primitive values', () => {
        expect(isSerializablePayload('string')).toBe(false);
        expect(isSerializablePayload(42)).toBe(false);
        expect(isSerializablePayload(true)).toBe(false);
      });

      it('should reject empty object', () => {
        expect(isSerializablePayload({})).toBe(false);
      });

      it('should reject object without type', () => {
        expect(isSerializablePayload({ props: {} })).toBe(false);
      });

      it('should reject object without props', () => {
        expect(isSerializablePayload({ type: 'Component' })).toBe(false);
      });

      it('should reject object with non-string type', () => {
        expect(isSerializablePayload({ type: 123, props: {} })).toBe(false);
        expect(isSerializablePayload({ type: null, props: {} })).toBe(false);
        expect(isSerializablePayload({ type: ['Component'], props: {} })).toBe(false);
      });

      it('should reject object with non-object props', () => {
        expect(isSerializablePayload({ type: 'C', props: 'string' })).toBe(false);
        expect(isSerializablePayload({ type: 'C', props: null })).toBe(false);
        expect(isSerializablePayload({ type: 'C', props: [1, 2] })).toBe(false);
      });

      it('should reject object with non-array children', () => {
        expect(isSerializablePayload({ type: 'C', props: {}, children: {} })).toBe(false);
        expect(isSerializablePayload({ type: 'C', props: {}, children: 'string' })).toBe(false);
      });

      it('should reject payload with invalid child', () => {
        expect(
          isSerializablePayload({
            type: 'Parent',
            props: {},
            children: [{ invalid: 'child' }],
          })
        ).toBe(false);
      });

      it('should reject payload with null in children array', () => {
        expect(
          isSerializablePayload({
            type: 'Parent',
            props: {},
            children: [null],
          })
        ).toBe(false);
      });
    });
  });

  // ==================== Type Guard Function ====================

  describe('isSerializablePayload type guard', () => {
    it('should narrow type correctly for valid payload', () => {
      const maybePayload: unknown = {
        type: 'Test',
        props: { key: 'value' },
      };

      if (isSerializablePayload(maybePayload)) {
        // Type should be narrowed - these should compile
        expect(maybePayload.type).toBe('Test');
        expect(maybePayload.props.key).toBe('value');
      } else {
        throw new Error('Should be valid payload');
      }
    });

    it('should return false for arrays', () => {
      expect(isSerializablePayload([])).toBe(false);
      expect(isSerializablePayload([{ type: 'T', props: {} }])).toBe(false);
    });

    it('should handle deeply nested validation', () => {
      const complexPayload = {
        type: 'Root',
        props: { config: { nested: { deep: true } } },
        children: [
          {
            type: 'Child',
            props: { items: [1, 2, 3] },
            children: [
              {
                type: 'GrandChild',
                props: {},
              },
            ],
          },
        ],
      };

      expect(isSerializablePayload(complexPayload)).toBe(true);
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should accept empty string as type', () => {
      const payload: SerializablePayload = {
        type: '',
        props: {},
      };

      expect(isSerializablePayload(payload)).toBe(true);
    });

    it('should accept type with special characters', () => {
      const payload: SerializablePayload = {
        type: 'my-component_v2.0',
        props: {},
      };

      expect(isSerializablePayload(payload)).toBe(true);
    });

    it('should accept props with symbol keys ignored', () => {
      const payload = {
        type: 'Component',
        props: { visible: true },
      };
      // Symbol keys should be ignored in serializable check
      (payload.props as Record<symbol, unknown>)[Symbol('hidden')] = 'value';

      expect(isSerializablePayload(payload)).toBe(true);
    });

    it('should handle very deep children nesting', () => {
      let payload: SerializablePayload = { type: 'Leaf', props: {} };
      for (let i = 0; i < 50; i++) {
        payload = { type: `Level${i}`, props: {}, children: [payload] };
      }

      expect(isSerializablePayload(payload)).toBe(true);
    });

    it('should handle many siblings', () => {
      const children: SerializablePayload[] = Array.from({ length: 100 }, (_, i) => ({
        type: `Item${i}`,
        props: { index: i },
      }));

      const payload: SerializablePayload = {
        type: 'Container',
        props: {},
        children,
      };

      expect(isSerializablePayload(payload)).toBe(true);
    });
  });
});
