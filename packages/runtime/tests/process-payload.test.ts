/**
 * Test suite for processPayload function
 *
 * Coverage:
 * - Basic payload processing
 * - Null/undefined handling
 * - Wrapper behavior around hydratePayload
 */

import { describe, it, expect } from 'vitest';
import { processPayload, type SerializablePayload, type HydrationResult } from '../src/index.js';

describe('processPayload', () => {
  // ==================== Basic Functionality ====================

  describe('basic payload processing', () => {
    it('should return HydrationResult from valid payload', () => {
      const payload: SerializablePayload = {
        type: 'TestComponent',
        props: { message: 'Hello' },
      };

      const result = processPayload(payload);

      expect(result).toBeDefined();
      expect(result.type).toBe('TestComponent');
      expect(result.props.message).toBe('Hello');
      expect(Array.isArray(result.children)).toBe(true);
    });

    it('should process payload with empty props', () => {
      const payload: SerializablePayload = {
        type: 'Empty',
        props: {},
      };

      const result = processPayload(payload);

      expect(result.type).toBe('Empty');
      expect(result.props).toEqual({});
    });

    it('should process payload with children', () => {
      const payload: SerializablePayload = {
        type: 'Parent',
        props: {},
        children: [
          { type: 'Child', props: { id: 1 } },
          { type: 'Child', props: { id: 2 } },
        ],
      };

      const result = processPayload(payload);

      expect(result.children).toHaveLength(2);
      expect(result.children[0].type).toBe('Child');
      expect(result.children[1].props.id).toBe(2);
    });

    it('should process nested payload structure', () => {
      const payload: SerializablePayload = {
        type: 'App',
        props: { title: 'My App' },
        children: [
          {
            type: 'Page',
            props: { route: '/home' },
            children: [
              { type: 'Header', props: {} },
              { type: 'Content', props: { text: 'Welcome' } },
            ],
          },
        ],
      };

      const result = processPayload(payload);

      expect(result.type).toBe('App');
      expect(result.children[0].type).toBe('Page');
      expect(result.children[0].children).toHaveLength(2);
    });

    it('should process payload with complex props', () => {
      const payload: SerializablePayload = {
        type: 'DataComponent',
        props: {
          string: 'text',
          number: 42,
          boolean: true,
          null: null,
          array: [1, 2, 3],
          object: { nested: { deep: 'value' } },
        },
      };

      const result = processPayload(payload);

      expect(result.props.string).toBe('text');
      expect(result.props.number).toBe(42);
      expect(result.props.boolean).toBe(true);
      expect(result.props.null).toBeNull();
      expect(result.props.array).toEqual([1, 2, 3]);
      expect((result.props.object as Record<string, unknown>).nested).toEqual({ deep: 'value' });
    });
  });

  // ==================== Null/Undefined Handling ====================

  describe('null and undefined payload handling', () => {
    it('should handle null payload gracefully', () => {
      const result = processPayload(null);

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('props');
      expect(result).toHaveProperty('children');
      expect(result.type).toBe('');
    });

    it('should handle undefined payload gracefully', () => {
      const result = processPayload(undefined);

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('props');
      expect(result).toHaveProperty('children');
      expect(result.type).toBe('');
    });

    it('should return default empty result for null payload', () => {
      const result = processPayload(null);

      expect(result.type).toBe('');
      expect(result.props).toEqual({});
      expect(result.children).toEqual([]);
    });

    it('should return default empty result for undefined payload', () => {
      const result = processPayload(undefined);

      expect(result.type).toBe('');
      expect(result.props).toEqual({});
      expect(result.children).toEqual([]);
    });
  });

  // ==================== Return Type ====================

  describe('return type', () => {
    it('should return object with type property', () => {
      const payload: SerializablePayload = {
        type: 'Test',
        props: {},
      };

      const result = processPayload(payload);

      expect(typeof result.type).toBe('string');
    });

    it('should return object with props property', () => {
      const payload: SerializablePayload = {
        type: 'Test',
        props: { key: 'value' },
      };

      const result = processPayload(payload);

      expect(typeof result.props).toBe('object');
      expect(result.props).not.toBeNull();
    });

    it('should return object with children array', () => {
      const payload: SerializablePayload = {
        type: 'Test',
        props: {},
      };

      const result = processPayload(payload);

      expect(Array.isArray(result.children)).toBe(true);
    });

    it('should return HydrationResult type', () => {
      const payload: SerializablePayload = {
        type: 'TypeCheck',
        props: { verified: true },
      };

      const result: HydrationResult = processPayload(payload);

      // TypeScript type check - this should compile
      const type: string = result.type;
      const props: Record<string, unknown> = result.props;
      const children: HydrationResult[] = result.children;

      expect(type).toBe('TypeCheck');
      expect(props.verified).toBe(true);
      expect(children).toEqual([]);
    });
  });

  // ==================== Consistency with hydratePayload ====================

  describe('consistency with hydratePayload', () => {
    it('should produce same result as hydratePayload for simple payload', () => {
      const payload: SerializablePayload = {
        type: 'Simple',
        props: { value: 42 },
      };

      const processPayloadResult = processPayload(payload);

      // Result should be equivalent to hydratePayload
      expect(processPayloadResult.type).toBe('Simple');
      expect(processPayloadResult.props.value).toBe(42);
      expect(processPayloadResult.children).toEqual([]);
    });

    it('should produce same result as hydratePayload for nested payload', () => {
      const payload: SerializablePayload = {
        type: 'Parent',
        props: {},
        children: [
          {
            type: 'Child',
            props: { id: 1 },
            children: [
              { type: 'GrandChild', props: { name: 'gc' } },
            ],
          },
        ],
      };

      const result = processPayload(payload);

      expect(result.children[0].children[0].type).toBe('GrandChild');
      expect(result.children[0].children[0].props.name).toBe('gc');
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle empty string type', () => {
      const payload: SerializablePayload = {
        type: '',
        props: {},
      };

      const result = processPayload(payload);

      expect(result.type).toBe('');
    });

    it('should handle payload with many children', () => {
      const children: SerializablePayload[] = Array.from({ length: 50 }, (_, i) => ({
        type: `Item${i}`,
        props: { index: i },
      }));

      const payload: SerializablePayload = {
        type: 'List',
        props: {},
        children,
      };

      const result = processPayload(payload);

      expect(result.children).toHaveLength(50);
    });

    it('should handle deeply nested payload', () => {
      let payload: SerializablePayload = { type: 'Leaf', props: {} };
      for (let i = 0; i < 20; i++) {
        payload = { type: `Level${i}`, props: {}, children: [payload] };
      }

      const result = processPayload(payload);

      expect(result.type).toBe('Level19');
      
      let current = result;
      for (let i = 0; i < 20; i++) {
        current = current.children[0];
      }
      expect(current.type).toBe('Leaf');
    });

    it('should handle payload with large props', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const payload: SerializablePayload = {
        type: 'LargeData',
        props: { data: largeArray },
      };

      const result = processPayload(payload);

      expect((result.props.data as number[]).length).toBe(1000);
    });

    it('should handle unicode in payload', () => {
      const payload: SerializablePayload = {
        type: 'International',
        props: {
          japanese: '日本語テキスト',
          korean: '한국어',
          arabic: 'العربية',
          emoji: '🌍🎉🚀',
        },
      };

      const result = processPayload(payload);

      expect(result.props.japanese).toBe('日本語テキスト');
      expect(result.props.emoji).toBe('🌍🎉🚀');
    });
  });

  // ==================== Multiple Calls ====================

  describe('multiple calls', () => {
    it('should handle multiple sequential calls', () => {
      const payload1: SerializablePayload = { type: 'First', props: { n: 1 } };
      const payload2: SerializablePayload = { type: 'Second', props: { n: 2 } };
      const payload3: SerializablePayload = { type: 'Third', props: { n: 3 } };

      const result1 = processPayload(payload1);
      const result2 = processPayload(payload2);
      const result3 = processPayload(payload3);

      expect(result1.type).toBe('First');
      expect(result2.type).toBe('Second');
      expect(result3.type).toBe('Third');
    });

    it('should return independent results for same payload', () => {
      const payload: SerializablePayload = {
        type: 'Shared',
        props: { count: 0 },
      };

      const result1 = processPayload(payload);
      const result2 = processPayload(payload);

      // Results should be independent
      expect(result1).not.toBe(result2);
      
      // Modifying one should not affect the other
      result1.props.count = 999;
      expect(result2.props.count).toBe(0);
    });
  });
});
