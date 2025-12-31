/**
 * Integration test suite for the full payload runtime flow
 *
 * Coverage:
 * - Full round-trip: ServerElement -> renderToPayload -> hydratePayload
 * - Data integrity preservation
 * - Serialization validation at render time (not hydration)
 * - Complex scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  renderToPayload,
  hydratePayload,
  type ServerElement,
  type SerializablePayload,
  type HydrationResult,
} from '../src/index.js';
import { SerializationError } from '@capsulersc/core';

describe('Integration: Full Payload Runtime Flow', () => {
  // ==================== Round-Trip Data Integrity ====================

  describe('round-trip data integrity', () => {
    it('should preserve simple string props through round-trip', () => {
      const element: ServerElement = {
        type: 'Greeting',
        props: { message: 'Hello, World!' },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.type).toBe('Greeting');
      expect(result.props.message).toBe('Hello, World!');
    });

    it('should preserve number props through round-trip', () => {
      const element: ServerElement = {
        type: 'Counter',
        props: { 
          count: 42, 
          price: 19.99, 
          negative: -100,
          zero: 0,
        },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.props.count).toBe(42);
      expect(result.props.price).toBe(19.99);
      expect(result.props.negative).toBe(-100);
      expect(result.props.zero).toBe(0);
    });

    it('should preserve boolean props through round-trip', () => {
      const element: ServerElement = {
        type: 'Toggle',
        props: { active: true, disabled: false },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.props.active).toBe(true);
      expect(result.props.disabled).toBe(false);
    });

    it('should preserve null props through round-trip', () => {
      const element: ServerElement = {
        type: 'Nullable',
        props: { value: null },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.props.value).toBeNull();
    });

    it('should preserve array props through round-trip', () => {
      const element: ServerElement = {
        type: 'List',
        props: { 
          items: ['apple', 'banana', 'cherry'],
          numbers: [1, 2, 3, 4, 5],
          mixed: [1, 'two', true, null],
        },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.props.items).toEqual(['apple', 'banana', 'cherry']);
      expect(result.props.numbers).toEqual([1, 2, 3, 4, 5]);
      expect(result.props.mixed).toEqual([1, 'two', true, null]);
    });

    it('should preserve nested object props through round-trip', () => {
      const element: ServerElement = {
        type: 'UserProfile',
        props: {
          user: {
            id: 1,
            name: 'Alice',
            address: {
              city: 'Tokyo',
              country: 'Japan',
              coordinates: {
                lat: 35.6762,
                lng: 139.6503,
              },
            },
            tags: ['developer', 'designer'],
          },
        },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      const user = result.props.user as Record<string, unknown>;
      expect(user.id).toBe(1);
      expect(user.name).toBe('Alice');
      
      const address = user.address as Record<string, unknown>;
      expect(address.city).toBe('Tokyo');
      
      const coords = address.coordinates as Record<string, number>;
      expect(coords.lat).toBe(35.6762);
    });

    it('should preserve complex element type through round-trip', () => {
      const element: ServerElement = {
        type: 'MyApp.Components.UserCard_v2',
        props: {},
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.type).toBe('MyApp.Components.UserCard_v2');
    });

    it('should preserve children structure through round-trip', () => {
      const element: ServerElement = {
        type: 'Container',
        props: { className: 'wrapper' },
        children: [
          { type: 'Header', props: { title: 'Welcome' } },
          { 
            type: 'Main', 
            props: {},
            children: [
              { type: 'Article', props: { id: 1, content: 'First article' } },
              { type: 'Article', props: { id: 2, content: 'Second article' } },
            ],
          },
          { type: 'Footer', props: { year: 2024 } },
        ],
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.type).toBe('Container');
      expect(result.props.className).toBe('wrapper');
      expect(result.children).toHaveLength(3);
      
      expect(result.children[0].type).toBe('Header');
      expect(result.children[0].props.title).toBe('Welcome');
      
      expect(result.children[1].type).toBe('Main');
      expect(result.children[1].children).toHaveLength(2);
      expect(result.children[1].children[0].props.content).toBe('First article');
      
      expect(result.children[2].type).toBe('Footer');
      expect(result.children[2].props.year).toBe(2024);
    });

    it('should preserve deeply nested tree through round-trip', () => {
      const element: ServerElement = {
        type: 'Level0',
        props: { depth: 0 },
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
                    children: [
                      {
                        type: 'Level4',
                        props: { depth: 4 },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      // Verify entire tree structure
      expect(result.props.depth).toBe(0);
      expect(result.children[0].props.depth).toBe(1);
      expect(result.children[0].children[0].props.depth).toBe(2);
      expect(result.children[0].children[0].children[0].props.depth).toBe(3);
      expect(result.children[0].children[0].children[0].children[0].props.depth).toBe(4);
    });
  });

  // ==================== Serialization at Render Time ====================

  describe('serialization validation at render time (not hydration)', () => {
    it('should catch function at render time', () => {
      const element: ServerElement = {
        type: 'Interactive',
        props: { onClick: () => console.log('clicked') },
      };

      // Error should occur at renderToPayload, not hydratePayload
      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should catch Date at render time', () => {
      const element: ServerElement = {
        type: 'Event',
        props: { scheduledAt: new Date('2024-01-01') },
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should catch nested non-serializable at render time', () => {
      const element: ServerElement = {
        type: 'Container',
        props: {},
        children: [
          {
            type: 'Child',
            props: {
              config: {
                callback: () => {},
              },
            },
          },
        ],
      };

      expect(() => renderToPayload(element)).toThrow(SerializationError);
    });

    it('should allow hydration of valid payload without re-validation', () => {
      // Create a valid payload manually
      const validPayload: SerializablePayload = {
        type: 'Test',
        props: { data: 'valid' },
        children: [
          { type: 'Child', props: { id: 1 } },
        ],
      };

      // hydratePayload should not perform additional validation
      // It trusts that the payload is already valid
      const result = hydratePayload(validPayload);

      expect(result.type).toBe('Test');
      expect(result.children[0].type).toBe('Child');
    });
  });

  // ==================== Complex Scenarios ====================

  describe('complex scenarios', () => {
    it('should handle realistic page structure', () => {
      const page: ServerElement = {
        type: 'Page',
        props: { 
          title: 'Dashboard',
          meta: {
            description: 'User dashboard',
            keywords: ['dashboard', 'user', 'analytics'],
          },
        },
        children: [
          {
            type: 'Navbar',
            props: {
              links: [
                { href: '/', label: 'Home' },
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/settings', label: 'Settings' },
              ],
            },
          },
          {
            type: 'Sidebar',
            props: { collapsed: false },
            children: [
              { type: 'MenuItem', props: { icon: 'home', text: 'Overview' } },
              { type: 'MenuItem', props: { icon: 'chart', text: 'Analytics' } },
              { type: 'MenuItem', props: { icon: 'user', text: 'Profile' } },
            ],
          },
          {
            type: 'MainContent',
            props: { className: 'container' },
            children: [
              {
                type: 'Widget',
                props: { 
                  type: 'stats',
                  data: { users: 1250, revenue: 50000, growth: 12.5 },
                },
              },
              {
                type: 'Widget',
                props: {
                  type: 'chart',
                  data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                    values: [100, 150, 120, 180],
                  },
                },
              },
            ],
          },
        ],
      };

      const payload = renderToPayload(page);
      const result = hydratePayload(payload);

      expect(result.type).toBe('Page');
      expect((result.props.meta as Record<string, unknown>).description).toBe('User dashboard');
      expect(result.children).toHaveLength(3);
      
      const sidebar = result.children[1];
      expect(sidebar.type).toBe('Sidebar');
      expect(sidebar.children).toHaveLength(3);
      
      const mainContent = result.children[2];
      expect(mainContent.children).toHaveLength(2);
      
      const statsWidget = mainContent.children[0];
      expect((statsWidget.props.data as Record<string, number>).users).toBe(1250);
    });

    it('should handle form data structure', () => {
      const form: ServerElement = {
        type: 'Form',
        props: {
          action: '/api/submit',
          method: 'POST',
          validation: {
            required: ['name', 'email'],
            patterns: {
              email: '^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$',
            },
          },
        },
        children: [
          {
            type: 'TextField',
            props: {
              name: 'name',
              label: 'Full Name',
              placeholder: 'Enter your name',
              maxLength: 100,
            },
          },
          {
            type: 'TextField',
            props: {
              name: 'email',
              label: 'Email Address',
              type: 'email',
              required: true,
            },
          },
          {
            type: 'SelectField',
            props: {
              name: 'country',
              label: 'Country',
              options: [
                { value: 'us', label: 'United States' },
                { value: 'jp', label: 'Japan' },
                { value: 'uk', label: 'United Kingdom' },
              ],
            },
          },
          {
            type: 'SubmitButton',
            props: { text: 'Submit', disabled: false },
          },
        ],
      };

      const payload = renderToPayload(form);
      const result = hydratePayload(payload);

      expect(result.type).toBe('Form');
      expect(result.props.action).toBe('/api/submit');
      expect(result.children).toHaveLength(4);
      
      const selectField = result.children[2];
      const options = selectField.props.options as Array<{ value: string; label: string }>;
      expect(options).toHaveLength(3);
      expect(options[1].label).toBe('Japan');
    });

    it('should handle internationalized content', () => {
      const i18nContent: ServerElement = {
        type: 'LocalizedPage',
        props: {
          locale: 'ja',
          translations: {
            title: 'Welcome',
            items: ['Item1', 'Item2', 'Item3'],
          },
        },
        children: [
          {
            type: 'LocalizedText',
            props: {
              ja: 'Japanese Text',
              en: 'English text',
            },
          },
        ],
      };

      const payload = renderToPayload(i18nContent);
      const result = hydratePayload(payload);

      expect(result.props.locale).toBe('ja');
      const translations = result.props.translations as Record<string, unknown>;
      expect(translations.title).toBe('Welcome');
      expect((translations.items as string[])[0]).toBe('Item1');
      
      const localizedText = result.children[0];
      expect(localizedText.props.ja).toBe('Japanese Text');
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle empty element tree', () => {
      const element: ServerElement = {
        type: 'Empty',
        props: {},
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.type).toBe('Empty');
      expect(result.props).toEqual({});
      expect(result.children).toEqual([]);
    });

    it('should handle maximum nesting depth', () => {
      let element: ServerElement = { type: 'Leaf', props: { n: 0 } };
      for (let i = 1; i <= 100; i++) {
        element = { type: 'N' + i, props: { n: i }, children: [element] };
      }

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.type).toBe('N100');
      
      // Navigate to leaf
      let current: HydrationResult = result;
      for (let i = 0; i < 100; i++) {
        current = current.children[0];
      }
      expect(current.type).toBe('Leaf');
    });

    it('should handle wide tree with many siblings', () => {
      const children: ServerElement[] = Array.from({ length: 200 }, (_, i) => ({
        type: 'Sibling',
        props: { index: i, data: 'data-' + i },
      }));

      const element: ServerElement = {
        type: 'WideBranch',
        props: {},
        children,
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.children).toHaveLength(200);
      expect(result.children[0].props.index).toBe(0);
      expect(result.children[199].props.index).toBe(199);
    });

    it('should handle element with very large props', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: 'Item ' + i,
        value: Math.random() * 1000,
      }));

      const element: ServerElement = {
        type: 'LargeData',
        props: { items: largeArray },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      const items = result.props.items as Array<{ id: number }>;
      expect(items).toHaveLength(1000);
      expect(items[500].id).toBe(500);
    });

    it('should preserve special string values', () => {
      const element: ServerElement = {
        type: 'SpecialStrings',
        props: {
          empty: '',
          whitespace: '   ',
          newlines: 'line1\nline2\nline3',
          tabs: 'col1\tcol2\tcol3',
          quotes: '"quoted" and \'single\'',
          backslash: 'path\\to\\file',
        },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.props.empty).toBe('');
      expect(result.props.whitespace).toBe('   ');
      expect(result.props.newlines).toBe('line1\nline2\nline3');
      expect(result.props.backslash).toBe('path\\to\\file');
    });

    it('should preserve numeric edge cases', () => {
      const element: ServerElement = {
        type: 'NumericEdges',
        props: {
          maxSafe: Number.MAX_SAFE_INTEGER,
          minSafe: Number.MIN_SAFE_INTEGER,
          maxValue: Number.MAX_VALUE,
          minValue: Number.MIN_VALUE,
          epsilon: Number.EPSILON,
          negativeZero: -0,
        },
      };

      const payload = renderToPayload(element);
      const result = hydratePayload(payload);

      expect(result.props.maxSafe).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.props.minSafe).toBe(Number.MIN_SAFE_INTEGER);
      expect(result.props.epsilon).toBe(Number.EPSILON);
      // Note: -0 becomes 0 in JSON, this is expected
    });
  });

  // ==================== JSON Serialization Compatibility ====================

  describe('JSON serialization compatibility', () => {
    it('should produce payload that is JSON-serializable', () => {
      const element: ServerElement = {
        type: 'JSONCompatible',
        props: {
          nested: {
            array: [1, 2, { key: 'value' }],
            object: { a: 1, b: 'two' },
          },
        },
        children: [
          { type: 'Child', props: { id: 1 } },
        ],
      };

      const payload = renderToPayload(element);
      
      // Should not throw
      const jsonString = JSON.stringify(payload);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.type).toBe('JSONCompatible');
    });

    it('should preserve data after JSON round-trip', () => {
      const element: ServerElement = {
        type: 'DataPreservation',
        props: {
          string: 'hello',
          number: 42.5,
          boolean: true,
          null: null,
          array: [1, 'two', null],
          object: { nested: { value: 'deep' } },
        },
      };

      const payload = renderToPayload(element);
      const jsonString = JSON.stringify(payload);
      const parsed = JSON.parse(jsonString) as SerializablePayload;
      const result = hydratePayload(parsed);

      expect(result.props.string).toBe('hello');
      expect(result.props.number).toBe(42.5);
      expect(result.props.boolean).toBe(true);
      expect(result.props.null).toBeNull();
      expect(result.props.array).toEqual([1, 'two', null]);
    });
  });
});
