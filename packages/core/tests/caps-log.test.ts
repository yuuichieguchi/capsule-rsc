/**
 * Test suite for LogCapability
 *
 * Coverage:
 * - info method with message and optional meta
 * - warn method with message and optional meta
 * - error method with message and optional meta
 * - Meta serialization validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogCapability, SerializationError } from '../src/index.js';

describe('LogCapability', () => {
  let logCapability: LogCapability;

  beforeEach(() => {
    logCapability = new LogCapability();
  });

  // ==================== Constructor ====================

  describe('constructor', () => {
    it('should create a LogCapability instance', () => {
      expect(logCapability).toBeInstanceOf(LogCapability);
    });
  });

  // ==================== info method ====================

  describe('info', () => {
    describe('message only', () => {
      it('should accept a simple string message', () => {
        expect(() => logCapability.info('Hello world')).not.toThrow();
      });

      it('should accept an empty string message', () => {
        expect(() => logCapability.info('')).not.toThrow();
      });

      it('should accept a message with unicode characters', () => {
        expect(() => logCapability.info('日本語メッセージ 🎉')).not.toThrow();
      });
    });

    describe('message with meta', () => {
      it('should accept message with null meta', () => {
        expect(() => logCapability.info('message', null)).not.toThrow();
      });

      it('should accept message with empty object meta', () => {
        expect(() => logCapability.info('message', {})).not.toThrow();
      });

      it('should accept message with primitive meta values', () => {
        expect(() =>
          logCapability.info('message', {
            count: 42,
            name: 'test',
            active: true,
            nothing: null,
          })
        ).not.toThrow();
      });

      it('should accept message with nested object meta', () => {
        expect(() =>
          logCapability.info('message', {
            user: {
              id: 1,
              profile: {
                name: 'John',
                tags: ['admin', 'user'],
              },
            },
          })
        ).not.toThrow();
      });

      it('should accept message with array meta', () => {
        expect(() => logCapability.info('message', { items: [1, 2, 3] })).not.toThrow();
      });
    });

    describe('meta validation', () => {
      it('should throw SerializationError for undefined meta', () => {
        expect(() => logCapability.info('message', undefined)).toThrow(SerializationError);
      });

      it('should throw SerializationError for function in meta', () => {
        expect(() => logCapability.info('message', { fn: () => {} })).toThrow(SerializationError);
      });

      it('should throw SerializationError for Symbol in meta', () => {
        expect(() => logCapability.info('message', { sym: Symbol() })).toThrow(SerializationError);
      });

      it('should throw SerializationError for Date in meta', () => {
        expect(() => logCapability.info('message', { date: new Date() })).toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for NaN in meta', () => {
        expect(() => logCapability.info('message', { value: NaN })).toThrow(SerializationError);
      });

      it('should throw SerializationError for nested non-serializable meta', () => {
        expect(() =>
          logCapability.info('message', {
            outer: {
              inner: {
                invalid: () => {},
              },
            },
          })
        ).toThrow(SerializationError);
      });
    });
  });

  // ==================== warn method ====================

  describe('warn', () => {
    describe('message only', () => {
      it('should accept a simple string message', () => {
        expect(() => logCapability.warn('Warning message')).not.toThrow();
      });

      it('should accept an empty string message', () => {
        expect(() => logCapability.warn('')).not.toThrow();
      });
    });

    describe('message with meta', () => {
      it('should accept message with null meta', () => {
        expect(() => logCapability.warn('warning', null)).not.toThrow();
      });

      it('should accept message with serializable meta', () => {
        expect(() =>
          logCapability.warn('warning', {
            errorCode: 'W001',
            details: { field: 'email', reason: 'invalid format' },
          })
        ).not.toThrow();
      });
    });

    describe('meta validation', () => {
      it('should throw SerializationError for function in meta', () => {
        expect(() => logCapability.warn('warning', { callback: () => {} })).toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for class instance in meta', () => {
        class MyClass {}
        expect(() => logCapability.warn('warning', { instance: new MyClass() })).toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for Map in meta', () => {
        expect(() => logCapability.warn('warning', { map: new Map() })).toThrow(SerializationError);
      });
    });
  });

  // ==================== error method ====================

  describe('error', () => {
    describe('message only', () => {
      it('should accept a simple string message', () => {
        expect(() => logCapability.error('Error occurred')).not.toThrow();
      });

      it('should accept an empty string message', () => {
        expect(() => logCapability.error('')).not.toThrow();
      });

      it('should accept a multiline error message', () => {
        expect(() => logCapability.error('Error:\n  Line 1\n  Line 2')).not.toThrow();
      });
    });

    describe('message with meta', () => {
      it('should accept message with null meta', () => {
        expect(() => logCapability.error('error', null)).not.toThrow();
      });

      it('should accept message with error details meta', () => {
        expect(() =>
          logCapability.error('error', {
            code: 'E001',
            stack: 'Error: something\n  at file.js:10',
            context: { userId: 123, action: 'save' },
          })
        ).not.toThrow();
      });

      it('should accept message with array of errors meta', () => {
        expect(() =>
          logCapability.error('validation errors', {
            errors: [
              { field: 'email', message: 'required' },
              { field: 'name', message: 'too short' },
            ],
          })
        ).not.toThrow();
      });
    });

    describe('meta validation', () => {
      it('should throw SerializationError for Error object in meta', () => {
        expect(() => logCapability.error('error', { original: new Error('test') })).toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for Promise in meta', () => {
        expect(() => logCapability.error('error', { pending: Promise.resolve() })).toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for BigInt in meta', () => {
        expect(() => logCapability.error('error', { bigValue: BigInt(123) })).toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for Infinity in meta', () => {
        expect(() => logCapability.error('error', { infinite: Infinity })).toThrow(
          SerializationError
        );
      });
    });
  });

  // ==================== Return Values ====================

  describe('return values', () => {
    it('info should return void', () => {
      const result = logCapability.info('message');
      expect(result).toBeUndefined();
    });

    it('warn should return void', () => {
      const result = logCapability.warn('message');
      expect(result).toBeUndefined();
    });

    it('error should return void', () => {
      const result = logCapability.error('message');
      expect(result).toBeUndefined();
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(100000);
      expect(() => logCapability.info(longMessage)).not.toThrow();
    });

    it('should handle very large meta object', () => {
      const largeMeta: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        largeMeta[`key${i}`] = i;
      }
      expect(() => logCapability.info('message', largeMeta)).not.toThrow();
    });

    it('should handle deeply nested meta', () => {
      let deep: unknown = { value: 'bottom' };
      for (let i = 0; i < 50; i++) {
        deep = { nested: deep };
      }
      expect(() => logCapability.info('message', deep)).not.toThrow();
    });

    it('should handle message with null bytes', () => {
      expect(() => logCapability.info('message\0with\0nulls')).not.toThrow();
    });

    it('should handle meta with numeric string keys', () => {
      expect(() => logCapability.info('message', { '0': 'zero', '1': 'one' })).not.toThrow();
    });
  });
});
