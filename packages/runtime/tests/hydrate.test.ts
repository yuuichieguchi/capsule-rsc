/**
 * Test suite for hydratePayload function
 *
 * Coverage:
 * - Simple payload hydration
 * - Recursive children hydration
 * - Empty children handling
 * - Complex nested structures
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  hydratePayload,
  hydrateFromString,
  type SerializablePayload,
  type HydrationResult,
} from '../src/index.js';

describe('hydratePayload', () => {
  // ==================== Simple Hydration ====================

  describe('simple payload hydration', () => {
    it('should hydrate payload with empty props', () => {
      const payload: SerializablePayload = {
        type: 'EmptyComponent',
        props: {},
      };

      const result = hydratePayload(payload);

      expect(result).toEqual({
        type: 'EmptyComponent',
        props: {},
        children: [],
      });
    });

    it('should hydrate payload with primitive props', () => {
      const payload: SerializablePayload = {
        type: 'UserCard',
        props: { name: 'John', age: 30, active: true },
      };

      const result = hydratePayload(payload);

      expect(result).toEqual({
        type: 'UserCard',
        props: { name: 'John', age: 30, active: true },
        children: [],
      });
    });

    it('should hydrate payload with nested object props', () => {
      const payload: SerializablePayload = {
        type: 'Profile',
        props: {
          user: {
            name: 'Alice',
            address: { city: 'Tokyo' },
          },
        },
      };

      const result = hydratePayload(payload);

      expect(result.type).toBe('Profile');
      expect((result.props.user as Record<string, unknown>).name).toBe('Alice');
      expect(result.children).toEqual([]);
    });

    it('should hydrate payload with array props', () => {
      const payload: SerializablePayload = {
        type: 'List',
        props: { items: [1, 2, 3, 4, 5] },
      };

      const result = hydratePayload(payload);

      expect(result.props.items).toEqual([1, 2, 3, 4, 5]);
    });

    it('should hydrate payload with null prop values', () => {
      const payload: SerializablePayload = {
        type: 'Nullable',
        props: { value: null, data: { nested: null } },
      };

      const result = hydratePayload(payload);

      expect(result.props.value).toBeNull();
      expect((result.props.data as Record<string, unknown>).nested).toBeNull();
    });
  });

  // ==================== Children Hydration ====================

  describe('children hydration', () => {
    it('should return empty children array when no children in payload', () => {
      const payload: SerializablePayload = {
        type: 'NoChildren',
        props: {},
      };

      const result = hydratePayload(payload);

      expect(result.children).toEqual([]);
      expect(Array.isArray(result.children)).toBe(true);
    });

    it('should hydrate payload with empty children array', () => {
      const payload: SerializablePayload = {
        type: 'EmptyChildren',
        props: {},
        children: [],
      };

      const result = hydratePayload(payload);

      expect(result.children).toEqual([]);
    });

    it('should hydrate payload with single child', () => {
      const payload: SerializablePayload = {
        type: 'Parent',
        props: { title: 'Parent' },
        children: [
          {
            type: 'Child',
            props: { label: 'First' },
          },
        ],
      };

      const result = hydratePayload(payload);

      expect(result.children).toHaveLength(1);
      expect(result.children[0].type).toBe('Child');
      expect(result.children[0].props.label).toBe('First');
      expect(result.children[0].children).toEqual([]);
    });

    it('should hydrate payload with multiple children', () => {
      const payload: SerializablePayload = {
        type: 'Container',
        props: {},
        children: [
          { type: 'Item', props: { id: 1 } },
          { type: 'Item', props: { id: 2 } },
          { type: 'Item', props: { id: 3 } },
        ],
      };

      const result = hydratePayload(payload);

      expect(result.children).toHaveLength(3);
      expect(result.children[0].props.id).toBe(1);
      expect(result.children[1].props.id).toBe(2);
      expect(result.children[2].props.id).toBe(3);
    });

    it('should recursively hydrate nested children', () => {
      const payload: SerializablePayload = {
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

      const result = hydratePayload(payload);

      expect(result.type).toBe('Root');
      expect(result.children[0].type).toBe('Level1');
      expect(result.children[0].children[0].type).toBe('Level2');
      expect(result.children[0].children[0].children[0].type).toBe('Level3');
      expect(result.children[0].children[0].children[0].props.depth).toBe(3);
      expect(result.children[0].children[0].children[0].children).toEqual([]);
    });

    it('should hydrate complex tree structure', () => {
      const payload: SerializablePayload = {
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
          {
            type: 'Main',
            props: {},
            children: [
              { type: 'Section', props: { id: 'hero' } },
              { type: 'Section', props: { id: 'features' } },
            ],
          },
          {
            type: 'Footer',
            props: { year: 2024 },
          },
        ],
      };

      const result = hydratePayload(payload);

      expect(result.type).toBe('Page');
      expect(result.children).toHaveLength(3);
      expect(result.children[0].type).toBe('Header');
      expect(result.children[0].children[0].type).toBe('Nav');
      expect(result.children[1].children).toHaveLength(2);
      expect(result.children[2].children).toEqual([]);
    });
  });

  // ==================== HydrationResult Structure ====================

  describe('HydrationResult structure', () => {
    it('should always have type property', () => {
      const payload: SerializablePayload = {
        type: 'TestType',
        props: {},
      };

      const result = hydratePayload(payload);

      expect(result).toHaveProperty('type');
      expect(typeof result.type).toBe('string');
    });

    it('should always have props property as object', () => {
      const payload: SerializablePayload = {
        type: 'Test',
        props: { key: 'value' },
      };

      const result = hydratePayload(payload);

      expect(result).toHaveProperty('props');
      expect(typeof result.props).toBe('object');
      expect(result.props).not.toBeNull();
    });

    it('should always have children property as array', () => {
      const payload: SerializablePayload = {
        type: 'Test',
        props: {},
      };

      const result = hydratePayload(payload);

      expect(result).toHaveProperty('children');
      expect(Array.isArray(result.children)).toBe(true);
    });

    it('should preserve all original props', () => {
      const payload: SerializablePayload = {
        type: 'Complex',
        props: {
          str: 'hello',
          num: 42,
          bool: true,
          nil: null,
          arr: [1, 2, 3],
          obj: { nested: 'value' },
        },
      };

      const result = hydratePayload(payload);

      expect(result.props.str).toBe('hello');
      expect(result.props.num).toBe(42);
      expect(result.props.bool).toBe(true);
      expect(result.props.nil).toBeNull();
      expect(result.props.arr).toEqual([1, 2, 3]);
      expect(result.props.obj).toEqual({ nested: 'value' });
    });

    it('should produce children that are also valid HydrationResults', () => {
      const payload: SerializablePayload = {
        type: 'Parent',
        props: {},
        children: [
          {
            type: 'Child',
            props: { id: 1 },
            children: [
              { type: 'GrandChild', props: {} },
            ],
          },
        ],
      };

      const result = hydratePayload(payload);
      const child = result.children[0];
      const grandChild = child.children[0];

      // Verify child structure
      expect(child).toHaveProperty('type');
      expect(child).toHaveProperty('props');
      expect(child).toHaveProperty('children');
      expect(Array.isArray(child.children)).toBe(true);

      // Verify grandchild structure
      expect(grandChild).toHaveProperty('type');
      expect(grandChild).toHaveProperty('props');
      expect(grandChild).toHaveProperty('children');
      expect(Array.isArray(grandChild.children)).toBe(true);
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle empty string type', () => {
      const payload: SerializablePayload = {
        type: '',
        props: {},
      };

      const result = hydratePayload(payload);

      expect(result.type).toBe('');
    });

    it('should handle type with special characters', () => {
      const payload: SerializablePayload = {
        type: 'my-component_v2.0',
        props: {},
      };

      const result = hydratePayload(payload);

      expect(result.type).toBe('my-component_v2.0');
    });

    it('should handle very deep nesting', () => {
      let payload: SerializablePayload = { type: 'Leaf', props: { depth: 0 } };
      for (let i = 1; i <= 50; i++) {
        payload = { type: `Level${i}`, props: { depth: i }, children: [payload] };
      }

      const result = hydratePayload(payload);

      expect(result.type).toBe('Level50');
      
      // Navigate to deepest child
      let current: HydrationResult = result;
      for (let i = 0; i < 50; i++) {
        expect(current.children).toHaveLength(1);
        current = current.children[0];
      }
      expect(current.type).toBe('Leaf');
      expect(current.props.depth).toBe(0);
    });

    it('should handle many siblings', () => {
      const children: SerializablePayload[] = Array.from({ length: 100 }, (_, i) => ({
        type: `Sibling${i}`,
        props: { index: i },
      }));

      const payload: SerializablePayload = {
        type: 'Parent',
        props: {},
        children,
      };

      const result = hydratePayload(payload);

      expect(result.children).toHaveLength(100);
      expect(result.children[0].type).toBe('Sibling0');
      expect(result.children[99].type).toBe('Sibling99');
    });

    it('should handle unicode in type and props', () => {
      const payload: SerializablePayload = {
        type: 'Unicode',
        props: {
          japanese: '日本語',
          emoji: '🎉🚀',
        },
      };

      const result = hydratePayload(payload);

      expect(result.props.japanese).toBe('日本語');
      expect(result.props.emoji).toBe('🎉🚀');
    });

    it('should handle props with numeric string keys', () => {
      const payload: SerializablePayload = {
        type: 'NumericKeys',
        props: { '0': 'first', '1': 'second' },
      };

      const result = hydratePayload(payload);

      expect(result.props['0']).toBe('first');
      expect(result.props['1']).toBe('second');
    });

    it('should handle large props object', () => {
      const props: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        props[`key${i}`] = i;
      }

      const payload: SerializablePayload = {
        type: 'LargeProps',
        props,
      };

      const result = hydratePayload(payload);

      expect(Object.keys(result.props)).toHaveLength(1000);
      expect(result.props.key500).toBe(500);
    });

    it('should handle array of mixed types in props', () => {
      const payload: SerializablePayload = {
        type: 'MixedArray',
        props: {
          mixed: [1, 'two', true, null, { key: 'value' }, [1, 2, 3]],
        },
      };

      const result = hydratePayload(payload);

      const mixed = result.props.mixed as unknown[];
      expect(mixed[0]).toBe(1);
      expect(mixed[1]).toBe('two');
      expect(mixed[2]).toBe(true);
      expect(mixed[3]).toBeNull();
      expect(mixed[4]).toEqual({ key: 'value' });
      expect(mixed[5]).toEqual([1, 2, 3]);
    });
  });

  // ==================== Immutability ====================

  describe('immutability', () => {
    it('should not mutate original payload', () => {
      const payload: SerializablePayload = {
        type: 'Original',
        props: { value: 'original' },
        children: [
          { type: 'Child', props: { id: 1 } },
        ],
      };

      const originalStr = JSON.stringify(payload);
      hydratePayload(payload);

      expect(JSON.stringify(payload)).toBe(originalStr);
    });

    it('should return a new object', () => {
      const payload: SerializablePayload = {
        type: 'Test',
        props: {},
      };

      const result = hydratePayload(payload);

      expect(result).not.toBe(payload);
    });

    it('should create new props object', () => {
      const props = { key: 'value' };
      const payload: SerializablePayload = {
        type: 'Test',
        props,
      };

      const result = hydratePayload(payload);

      // Props might be same reference or copy depending on implementation
      // But modifying result.props should not affect original
      result.props.newKey = 'new';
      expect(props).not.toHaveProperty('newKey');
    });
  });
});

// ==================== hydrateFromString Tests ====================

describe('hydrateFromString', () => {
  describe('basic deserialization', () => {
    it('should hydrate simple JSON string', () => {
      const json = '{"type":"Button","props":{"label":"Click me"}}';

      const result = hydrateFromString(json);

      expect(result.type).toBe('Button');
      expect(result.props.label).toBe('Click me');
      expect(result.children).toEqual([]);
    });

    it('should hydrate JSON with children', () => {
      const json = JSON.stringify({
        type: 'Container',
        props: {},
        children: [
          { type: 'Child', props: { id: 1 } },
          { type: 'Child', props: { id: 2 } },
        ],
      });

      const result = hydrateFromString(json);

      expect(result.type).toBe('Container');
      expect(result.children).toHaveLength(2);
      expect(result.children[0].props.id).toBe(1);
      expect(result.children[0].children).toEqual([]);
    });

    it('should hydrate complex nested structures', () => {
      const json = JSON.stringify({
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
      });

      const result = hydrateFromString(json);

      expect(result.type).toBe('Page');
      expect(result.children[0].type).toBe('Header');
      expect(result.children[0].children[0].type).toBe('Nav');
      expect(result.children[0].children[0].props.items).toEqual(['Home', 'About']);
    });

    it('should handle unicode characters', () => {
      const json = JSON.stringify({
        type: 'Unicode',
        props: { japanese: '日本語', emoji: '🎉' },
      });

      const result = hydrateFromString(json);

      expect(result.props.japanese).toBe('日本語');
      expect(result.props.emoji).toBe('🎉');
    });

    it('should handle null prop values', () => {
      const json = JSON.stringify({
        type: 'Nullable',
        props: { value: null },
      });

      const result = hydrateFromString(json);

      expect(result.props.value).toBeNull();
    });
  });

  describe('return type', () => {
    it('should return valid HydrationResult', () => {
      const json = '{"type":"Test","props":{"key":"value"}}';

      const result = hydrateFromString(json);

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('props');
      expect(result).toHaveProperty('children');
      expect(typeof result.type).toBe('string');
      expect(typeof result.props).toBe('object');
      expect(Array.isArray(result.children)).toBe(true);
    });

    it('should always return children as array even without children in JSON', () => {
      const json = '{"type":"NoChildren","props":{}}';

      const result = hydrateFromString(json);

      expect(result.children).toEqual([]);
      expect(Array.isArray(result.children)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw SyntaxError for invalid JSON', () => {
      const invalidJson = '{invalid json}';

      expect(() => hydrateFromString(invalidJson)).toThrow(SyntaxError);
    });

    it('should throw for empty string', () => {
      expect(() => hydrateFromString('')).toThrow();
    });
  });
});
