/**
 * Test suite for renderToPayload function
 *
 * Coverage:
 * - Simple element conversion
 * - Nested children conversion
 * - Serialization validation
 * - Error handling for non-serializable props
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import { renderToPayload, renderToString, type ServerElement, type SerializablePayload } from '../src/index.js';
import { SerializationError } from '@capsulersc/core';

describe('renderToPayload', () => {
  // ==================== Happy Path ====================

  describe('simple element conversion', () => {
    it('should convert element with empty props', () => {
      const element: ServerElement = {
        type: 'EmptyComponent',
        props: {},
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'EmptyComponent',
        props: {},
      });
    });

    it('should convert element with string prop', () => {
      const element: ServerElement = {
        type: 'Greeting',
        props: { message: 'Hello, World!' },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'Greeting',
        props: { message: 'Hello, World!' },
      });
    });

    it('should convert element with number prop', () => {
      const element: ServerElement = {
        type: 'Counter',
        props: { count: 42 },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'Counter',
        props: { count: 42 },
      });
    });

    it('should convert element with boolean prop', () => {
      const element: ServerElement = {
        type: 'Toggle',
        props: { enabled: true },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'Toggle',
        props: { enabled: true },
      });
    });

    it('should convert element with null prop', () => {
      const element: ServerElement = {
        type: 'NullableField',
        props: { value: null },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'NullableField',
        props: { value: null },
      });
    });

    it('should convert element with multiple primitive props', () => {
      const element: ServerElement = {
        type: 'UserCard',
        props: { name: 'John', age: 30, active: true },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'UserCard',
        props: { name: 'John', age: 30, active: true },
      });
    });

    it('should convert element with nested object prop', () => {
      const element: ServerElement = {
        type: 'Profile',
        props: {
          user: {
            name: 'Alice',
            address: {
              city: 'Tokyo',
              zip: '100-0001',
            },
          },
        },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'Profile',
        props: {
          user: {
            name: 'Alice',
            address: {
              city: 'Tokyo',
              zip: '100-0001',
            },
          },
        },
      });
    });

    it('should convert element with array prop', () => {
      const element: ServerElement = {
        type: 'List',
        props: { items: ['apple', 'banana', 'cherry'] },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'List',
        props: { items: ['apple', 'banana', 'cherry'] },
      });
    });

    it('should convert element with array of objects prop', () => {
      const element: ServerElement = {
        type: 'UserList',
        props: {
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'UserList',
        props: {
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        },
      });
    });
  });

  // ==================== Children Conversion ====================

  describe('children conversion', () => {
    it('should convert element with empty children array', () => {
      const element: ServerElement = {
        type: 'Container',
        props: {},
        children: [],
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'Container',
        props: {},
        children: [],
      });
    });

    it('should convert element with single child', () => {
      const element: ServerElement = {
        type: 'Parent',
        props: { title: 'Parent Title' },
        children: [
          {
            type: 'Child',
            props: { label: 'Child Label' },
          },
        ],
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'Parent',
        props: { title: 'Parent Title' },
        children: [
          {
            type: 'Child',
            props: { label: 'Child Label' },
          },
        ],
      });
    });

    it('should convert element with multiple children', () => {
      const element: ServerElement = {
        type: 'List',
        props: {},
        children: [
          { type: 'Item', props: { id: 1 } },
          { type: 'Item', props: { id: 2 } },
          { type: 'Item', props: { id: 3 } },
        ],
      };

      const payload = renderToPayload(element);

      expect(payload.children).toHaveLength(3);
      expect(payload.children?.[0]).toEqual({ type: 'Item', props: { id: 1 } });
      expect(payload.children?.[1]).toEqual({ type: 'Item', props: { id: 2 } });
      expect(payload.children?.[2]).toEqual({ type: 'Item', props: { id: 3 } });
    });

    it('should recursively convert nested children', () => {
      const element: ServerElement = {
        type: 'Root',
        props: {},
        children: [
          {
            type: 'Level1',
            props: { depth: 1 },
            children: [
              {
                type: 'Level2',
                props: { depth: 2 },
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

      const payload = renderToPayload(element);

      expect(payload.type).toBe('Root');
      expect(payload.children?.[0].type).toBe('Level1');
      expect(payload.children?.[0].children?.[0].type).toBe('Level2');
      expect(payload.children?.[0].children?.[0].children?.[0].type).toBe('Level3');
      expect(payload.children?.[0].children?.[0].children?.[0].props).toEqual({ depth: 3 });
    });

    it('should convert element with mixed children types', () => {
      const element: ServerElement = {
        type: 'Page',
        props: { title: 'My Page' },
        children: [
          { type: 'Header', props: { text: 'Welcome' } },
          {
            type: 'Section',
            props: { id: 'main' },
            children: [
              { type: 'Paragraph', props: { content: 'Hello' } },
            ],
          },
          { type: 'Footer', props: { year: 2024 } },
        ],
      };

      const payload = renderToPayload(element);

      expect(payload.children).toHaveLength(3);
      expect(payload.children?.[0].type).toBe('Header');
      expect(payload.children?.[1].type).toBe('Section');
      expect(payload.children?.[1].children?.[0].type).toBe('Paragraph');
      expect(payload.children?.[2].type).toBe('Footer');
    });
  });

  // ==================== Error Handling ====================

  describe('error handling for non-serializable props', () => {
    it('should throw SerializationError for function prop', () => {
      const element: ServerElement = {
        type: 'Button',
        props: { onClick: () => console.log('clicked') },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for Date prop', () => {
      const element: ServerElement = {
        type: 'Event',
        props: { date: new Date('2024-01-01') },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for undefined prop', () => {
      const element: ServerElement = {
        type: 'Optional',
        props: { value: undefined },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for Symbol prop', () => {
      const element: ServerElement = {
        type: 'Tagged',
        props: { tag: Symbol('unique') },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for BigInt prop', () => {
      const element: ServerElement = {
        type: 'BigNumber',
        props: { value: BigInt(9007199254740991) },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for Map prop', () => {
      const element: ServerElement = {
        type: 'MapHolder',
        props: { data: new Map([['key', 'value']]) },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for Set prop', () => {
      const element: ServerElement = {
        type: 'SetHolder',
        props: { items: new Set([1, 2, 3]) },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for class instance prop', () => {
      class MyClass {
        value = 42;
      }
      const element: ServerElement = {
        type: 'ClassHolder',
        props: { instance: new MyClass() },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for RegExp prop', () => {
      const element: ServerElement = {
        type: 'Validator',
        props: { pattern: /^test$/i },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for NaN prop', () => {
      const element: ServerElement = {
        type: 'Invalid',
        props: { value: NaN },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for Infinity prop', () => {
      const element: ServerElement = {
        type: 'Invalid',
        props: { value: Infinity },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for nested non-serializable value', () => {
      const element: ServerElement = {
        type: 'Nested',
        props: {
          data: {
            inner: {
              callback: () => {},
            },
          },
        },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for non-serializable value in array', () => {
      const element: ServerElement = {
        type: 'ArrayHolder',
        props: {
          items: [1, 2, () => {}, 4],
        },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for non-serializable prop in child', () => {
      const element: ServerElement = {
        type: 'Parent',
        props: {},
        children: [
          {
            type: 'Child',
            props: { handler: () => {} },
          },
        ],
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for deeply nested non-serializable prop', () => {
      const element: ServerElement = {
        type: 'Root',
        props: {},
        children: [
          {
            type: 'Level1',
            props: {},
            children: [
              {
                type: 'Level2',
                props: { date: new Date() },
              },
            ],
          },
        ],
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should include path information in SerializationError', () => {
      const element: ServerElement = {
        type: 'Component',
        props: {
          user: {
            callback: () => {},
          },
        },
      };

      try {
        renderToPayload(element);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SerializationError);
        expect((error as SerializationError).path).toContain('user');
      }
    });
  });

  // ==================== Null/Undefined Handling ====================

  describe('null and undefined handling', () => {
    it('should handle null props value correctly', () => {
      const element: ServerElement = {
        type: 'Nullable',
        props: { value: null, other: 'test' },
      };

      const payload = renderToPayload(element);

      expect(payload.props.value).toBeNull();
      expect(payload.props.other).toBe('test');
    });

    it('should handle nested null values in props', () => {
      const element: ServerElement = {
        type: 'DeepNullable',
        props: {
          data: {
            level1: {
              level2: null,
            },
          },
        },
      };

      const payload = renderToPayload(element);

      expect(
        (payload.props.data as Record<string, unknown>).level1 as Record<string, unknown>
      ).toEqual({ level2: null });
    });

    it('should handle array with null values', () => {
      const element: ServerElement = {
        type: 'NullArray',
        props: { items: [1, null, 3, null, 5] },
      };

      const payload = renderToPayload(element);

      expect(payload.props.items).toEqual([1, null, 3, null, 5]);
    });

    it('should omit children field when undefined', () => {
      const element: ServerElement = {
        type: 'NoChildren',
        props: { value: 'test' },
      };

      const payload = renderToPayload(element);

      expect(payload).toEqual({
        type: 'NoChildren',
        props: { value: 'test' },
      });
      expect('children' in payload).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle empty string type', () => {
      const element: ServerElement = {
        type: '',
        props: { key: 'value' },
      };

      const payload = renderToPayload(element);

      expect(payload.type).toBe('');
    });

    it('should handle type with special characters', () => {
      const element: ServerElement = {
        type: 'my-component_v2.0',
        props: {},
      };

      const payload = renderToPayload(element);

      expect(payload.type).toBe('my-component_v2.0');
    });

    it('should handle very long string props', () => {
      const longString = 'x'.repeat(10000);
      const element: ServerElement = {
        type: 'LongContent',
        props: { content: longString },
      };

      const payload = renderToPayload(element);

      expect((payload.props.content as string).length).toBe(10000);
    });

    it('should handle deeply nested props', () => {
      let nested: unknown = 'deep';
      for (let i = 0; i < 50; i++) {
        nested = { level: nested };
      }

      const element: ServerElement = {
        type: 'DeepProps',
        props: { data: nested as Record<string, unknown> },
      };

      const payload = renderToPayload(element);

      expect(payload.type).toBe('DeepProps');
      expect(payload.props.data).toBeDefined();
    });

    it('should handle element with many children', () => {
      const children: ServerElement[] = Array.from({ length: 100 }, (_, i) => ({
        type: `Item${i}`,
        props: { index: i },
      }));

      const element: ServerElement = {
        type: 'LargeList',
        props: {},
        children,
      };

      const payload = renderToPayload(element);

      expect(payload.children).toHaveLength(100);
    });

    it('should handle unicode in props', () => {
      const element: ServerElement = {
        type: 'Unicode',
        props: {
          japanese: '日本語',
          emoji: '🎉🚀',
          mixed: 'Hello 世界 !',
        },
      };

      const payload = renderToPayload(element);

      expect(payload.props.japanese).toBe('日本語');
      expect(payload.props.emoji).toBe('🎉🚀');
    });

    it('should handle props with numeric keys', () => {
      const element: ServerElement = {
        type: 'NumericKeys',
        props: { 0: 'first', 1: 'second', 2: 'third' },
      };

      const payload = renderToPayload(element);

      expect(payload.props[0]).toBe('first');
    });

    it('should preserve prop order', () => {
      const element: ServerElement = {
        type: 'Ordered',
        props: { z: 1, a: 2, m: 3 },
      };

      const payload = renderToPayload(element);
      const keys = Object.keys(payload.props);

      // Note: Object key order is preserved for string keys in modern JS
      expect(keys).toContain('z');
      expect(keys).toContain('a');
      expect(keys).toContain('m');
    });
  });

  // ==================== Return Type ====================

  describe('return type validation', () => {
    it('should return valid SerializablePayload', () => {
      const element: ServerElement = {
        type: 'Test',
        props: { data: [1, 2, { nested: true }] },
        children: [
          { type: 'Child', props: {} },
        ],
      };

      const payload = renderToPayload(element);

      // Verify structure matches SerializablePayload
      expect(typeof payload.type).toBe('string');
      expect(typeof payload.props).toBe('object');
      expect(payload.props).not.toBeNull();
      expect(Array.isArray(payload.children)).toBe(true);
    });
  });
});

// ==================== renderToString Tests ====================

describe('renderToString', () => {
  describe('basic serialization', () => {
    it('should convert simple element to JSON string', () => {
      const element: ServerElement = {
        type: 'Button',
        props: { label: 'Click me' },
      };

      const json = renderToString(element);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        type: 'Button',
        props: { label: 'Click me' },
      });
    });

    it('should convert element with children to JSON string', () => {
      const element: ServerElement = {
        type: 'Container',
        props: {},
        children: [
          { type: 'Child', props: { id: 1 } },
          { type: 'Child', props: { id: 2 } },
        ],
      };

      const json = renderToString(element);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('Container');
      expect(parsed.children).toHaveLength(2);
      expect(parsed.children[0].props.id).toBe(1);
    });

    it('should produce valid JSON', () => {
      const element: ServerElement = {
        type: 'Test',
        props: { value: 'test' },
      };

      const json = renderToString(element);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should handle complex nested structures', () => {
      const element: ServerElement = {
        type: 'Page',
        props: { title: 'Home' },
        children: [
          {
            type: 'Header',
            props: { logo: '/logo.png' },
            children: [
              { type: 'Nav', props: { items: ['Home', 'About'] } },
            ],
          },
          { type: 'Footer', props: { year: 2024 } },
        ],
      };

      const json = renderToString(element);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('Page');
      expect(parsed.children[0].children[0].props.items).toEqual(['Home', 'About']);
    });

    it('should handle unicode characters', () => {
      const element: ServerElement = {
        type: 'Unicode',
        props: { japanese: '日本語', emoji: '🎉' },
      };

      const json = renderToString(element);
      const parsed = JSON.parse(json);

      expect(parsed.props.japanese).toBe('日本語');
      expect(parsed.props.emoji).toBe('🎉');
    });
  });

  describe('error handling', () => {
    it('should throw SerializationError for non-serializable props', () => {
      const element: ServerElement = {
        type: 'Invalid',
        props: { callback: () => {} },
      };

      expect(() => renderToString(element)).toThrow(SerializationError);
    });

    it('should throw SerializationError for nested non-serializable values', () => {
      const element: ServerElement = {
        type: 'Nested',
        props: {
          data: { fn: () => {} },
        },
      };

      expect(() => renderToString(element)).toThrow(SerializationError);
    });
  });
});
