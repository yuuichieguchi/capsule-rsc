/**
 * Test suite for Action Registry
 *
 * Coverage:
 * - registerAction: successful registration, duplicate handling
 * - invokeAction: invoke registered actions, validation of input/output
 * - Error handling for non-serializable data
 * - Error handling for unregistered actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerAction,
  invokeAction,
  clearActionRegistry,
  ActionRegistry,
  ActionNotFoundError,
  SerializationError,
} from '../src/index.js';

describe('Action Registry', () => {
  beforeEach(() => {
    // Clear registry before each test to ensure isolation
    clearActionRegistry();
  });

  // ==================== registerAction ====================

  describe('registerAction', () => {
    describe('successful registration', () => {
      it('should register an action with a unique name', () => {
        const action = vi.fn().mockResolvedValue({ result: 'success' });
        expect(() => registerAction('myAction', action)).not.toThrow();
      });

      it('should register multiple actions with different names', () => {
        const action1 = vi.fn().mockResolvedValue({ result: 1 });
        const action2 = vi.fn().mockResolvedValue({ result: 2 });
        const action3 = vi.fn().mockResolvedValue({ result: 3 });

        expect(() => {
          registerAction('action1', action1);
          registerAction('action2', action2);
          registerAction('action3', action3);
        }).not.toThrow();
      });

      it('should accept synchronous action handlers', () => {
        const syncAction = vi.fn().mockReturnValue({ sync: true });
        expect(() => registerAction('syncAction', syncAction)).not.toThrow();
      });

      it('should accept async action handlers', () => {
        const asyncAction = vi.fn().mockResolvedValue({ async: true });
        expect(() => registerAction('asyncAction', asyncAction)).not.toThrow();
      });

      it('should accept action with complex name', () => {
        const action = vi.fn().mockResolvedValue({});
        expect(() => registerAction('namespace/module/action', action)).not.toThrow();
      });

      it('should accept action with dot notation name', () => {
        const action = vi.fn().mockResolvedValue({});
        expect(() => registerAction('user.create', action)).not.toThrow();
      });
    });

    describe('duplicate registration', () => {
      it('should throw error when registering duplicate action name', () => {
        const action1 = vi.fn();
        const action2 = vi.fn();

        registerAction('duplicateAction', action1);
        expect(() => registerAction('duplicateAction', action2)).toThrow();
      });

      it('should throw specific error type for duplicate registration', () => {
        const action = vi.fn();
        registerAction('myAction', action);
        expect(() => registerAction('myAction', action)).toThrow(
          /already registered|duplicate/i
        );
      });

      it('should include action name in duplicate error message', () => {
        const action = vi.fn();
        registerAction('specificActionName', action);
        expect(() => registerAction('specificActionName', action)).toThrow(
          /specificActionName/
        );
      });
    });

    describe('invalid registration', () => {
      it('should throw error for empty action name', () => {
        const action = vi.fn();
        expect(() => registerAction('', action)).toThrow();
      });

      it('should throw error for null handler', () => {
        expect(() => registerAction('myAction', null as unknown as () => unknown)).toThrow();
      });

      it('should throw error for undefined handler', () => {
        expect(() => registerAction('myAction', undefined as unknown as () => unknown)).toThrow();
      });

      it('should throw error for non-function handler', () => {
        expect(() => registerAction('myAction', 'not a function' as unknown as () => unknown)).toThrow();
      });
    });
  });

  // ==================== invokeAction ====================

  describe('invokeAction', () => {
    describe('invoking registered actions', () => {
      it('should invoke registered action with input', async () => {
        const action = vi.fn().mockResolvedValue({ result: 'success' });
        registerAction('testAction', action);

        await invokeAction('testAction', { key: 'value' });
        expect(action).toHaveBeenCalledWith({ key: 'value' });
      });

      it('should return action result', async () => {
        const action = vi.fn().mockResolvedValue({ id: 123, name: 'Test' });
        registerAction('getUser', action);

        const result = await invokeAction('getUser', { userId: 123 });
        expect(result).toEqual({ id: 123, name: 'Test' });
      });

      it('should handle synchronous action handlers', async () => {
        const syncAction = vi.fn().mockReturnValue({ sync: true });
        registerAction('syncAction', syncAction);

        const result = await invokeAction('syncAction', {});
        expect(result).toEqual({ sync: true });
      });

      it('should handle action with no input', async () => {
        const action = vi.fn().mockResolvedValue({ noInput: true });
        registerAction('noInputAction', action);

        const result = await invokeAction('noInputAction', null);
        expect(result).toEqual({ noInput: true });
      });

      it('should handle action returning null', async () => {
        const action = vi.fn().mockResolvedValue(null);
        registerAction('nullAction', action);

        const result = await invokeAction('nullAction', {});
        expect(result).toBeNull();
      });

      it('should handle action returning primitive values', async () => {
        const numberAction = vi.fn().mockResolvedValue(42);
        const stringAction = vi.fn().mockResolvedValue('hello');
        const boolAction = vi.fn().mockResolvedValue(true);

        registerAction('numberAction', numberAction);
        registerAction('stringAction', stringAction);
        registerAction('boolAction', boolAction);

        expect(await invokeAction('numberAction', {})).toBe(42);
        expect(await invokeAction('stringAction', {})).toBe('hello');
        expect(await invokeAction('boolAction', {})).toBe(true);
      });

      it('should pass complex nested input to action', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('complexAction', action);

        const complexInput = {
          user: {
            id: 1,
            profile: {
              name: 'John',
              tags: ['admin', 'user'],
            },
          },
          settings: {
            notifications: true,
          },
        };

        await invokeAction('complexAction', complexInput);
        expect(action).toHaveBeenCalledWith(complexInput);
      });
    });

    describe('input validation', () => {
      it('should throw SerializationError for undefined input', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        await expect(invokeAction('testAction', undefined)).rejects.toThrow(SerializationError);
      });

      it('should throw SerializationError for function in input', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        await expect(invokeAction('testAction', { fn: () => {} })).rejects.toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for Symbol in input', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        await expect(invokeAction('testAction', { sym: Symbol() })).rejects.toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for Date in input', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        await expect(invokeAction('testAction', { date: new Date() })).rejects.toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for NaN in input', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        await expect(invokeAction('testAction', { value: NaN })).rejects.toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for BigInt in input', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        await expect(invokeAction('testAction', { big: BigInt(123) })).rejects.toThrow(
          SerializationError
        );
      });

      it('should throw SerializationError for nested non-serializable input', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        await expect(
          invokeAction('testAction', {
            outer: {
              inner: {
                invalid: () => {},
              },
            },
          })
        ).rejects.toThrow(SerializationError);
      });

      it('should not invoke action if input validation fails', async () => {
        const action = vi.fn().mockResolvedValue({});
        registerAction('testAction', action);

        try {
          await invokeAction('testAction', { fn: () => {} });
        } catch {
          // Expected to throw
        }

        expect(action).not.toHaveBeenCalled();
      });
    });

    describe('output validation', () => {
      it('should throw SerializationError when action returns function', async () => {
        const action = vi.fn().mockResolvedValue({ callback: () => {} });
        registerAction('badOutputAction', action);

        await expect(invokeAction('badOutputAction', {})).rejects.toThrow(SerializationError);
      });

      it('should throw SerializationError when action returns Symbol', async () => {
        const action = vi.fn().mockResolvedValue({ sym: Symbol() });
        registerAction('badOutputAction', action);

        await expect(invokeAction('badOutputAction', {})).rejects.toThrow(SerializationError);
      });

      it('should throw SerializationError when action returns Date', async () => {
        const action = vi.fn().mockResolvedValue({ timestamp: new Date() });
        registerAction('badOutputAction', action);

        await expect(invokeAction('badOutputAction', {})).rejects.toThrow(SerializationError);
      });

      it('should throw SerializationError when action returns undefined', async () => {
        const action = vi.fn().mockResolvedValue(undefined);
        registerAction('undefinedAction', action);

        await expect(invokeAction('undefinedAction', {})).rejects.toThrow(SerializationError);
      });

      it('should throw SerializationError when action returns NaN', async () => {
        const action = vi.fn().mockResolvedValue(NaN);
        registerAction('nanAction', action);

        await expect(invokeAction('nanAction', {})).rejects.toThrow(SerializationError);
      });

      it('should throw SerializationError when action returns class instance', async () => {
        class MyClass {
          value = 1;
        }
        const action = vi.fn().mockResolvedValue(new MyClass());
        registerAction('classAction', action);

        await expect(invokeAction('classAction', {})).rejects.toThrow(SerializationError);
      });

      it('should throw SerializationError for nested non-serializable output', async () => {
        const action = vi.fn().mockResolvedValue({
          data: {
            nested: {
              invalid: new Map(),
            },
          },
        });
        registerAction('nestedBadAction', action);

        await expect(invokeAction('nestedBadAction', {})).rejects.toThrow(SerializationError);
      });
    });

    describe('unregistered actions', () => {
      it('should throw ActionNotFoundError for unregistered action', async () => {
        await expect(invokeAction('nonExistentAction', {})).rejects.toThrow(ActionNotFoundError);
      });

      it('should include action name in error message', async () => {
        await expect(invokeAction('missingAction', {})).rejects.toThrow(/missingAction/);
      });

      it('should throw ActionNotFoundError even with valid input', async () => {
        await expect(invokeAction('unknownAction', { valid: 'input' })).rejects.toThrow(
          ActionNotFoundError
        );
      });
    });

    describe('error propagation', () => {
      it('should propagate action handler errors', async () => {
        const action = vi.fn().mockRejectedValue(new Error('Handler error'));
        registerAction('errorAction', action);

        await expect(invokeAction('errorAction', {})).rejects.toThrow('Handler error');
      });

      it('should propagate synchronous action errors', async () => {
        const action = vi.fn().mockImplementation(() => {
          throw new Error('Sync error');
        });
        registerAction('syncErrorAction', action);

        await expect(invokeAction('syncErrorAction', {})).rejects.toThrow('Sync error');
      });
    });
  });

  // ==================== ActionRegistry Class ====================

  describe('ActionRegistry class', () => {
    it('should allow creating isolated registry instances', () => {
      const registry1 = new ActionRegistry();
      const registry2 = new ActionRegistry();

      expect(registry1).toBeInstanceOf(ActionRegistry);
      expect(registry2).toBeInstanceOf(ActionRegistry);
      expect(registry1).not.toBe(registry2);
    });

    it('should have isolated actions between instances', async () => {
      const registry1 = new ActionRegistry();
      const registry2 = new ActionRegistry();

      const action1 = vi.fn().mockResolvedValue({ from: 'registry1' });
      const action2 = vi.fn().mockResolvedValue({ from: 'registry2' });

      registry1.register('action', action1);
      registry2.register('action', action2);

      expect(await registry1.invoke('action', {})).toEqual({ from: 'registry1' });
      expect(await registry2.invoke('action', {})).toEqual({ from: 'registry2' });
    });

    it('should have register method', () => {
      const registry = new ActionRegistry();
      expect(typeof registry.register).toBe('function');
    });

    it('should have invoke method', () => {
      const registry = new ActionRegistry();
      expect(typeof registry.invoke).toBe('function');
    });

    it('should have clear method', () => {
      const registry = new ActionRegistry();
      expect(typeof registry.clear).toBe('function');
    });

    it('should clear all registered actions', async () => {
      const registry = new ActionRegistry();
      const action = vi.fn().mockResolvedValue({});

      registry.register('testAction', action);
      registry.clear();

      await expect(registry.invoke('testAction', {})).rejects.toThrow(ActionNotFoundError);
    });

    it('should have has method to check action existence', () => {
      const registry = new ActionRegistry();
      const action = vi.fn();

      expect(registry.has('testAction')).toBe(false);
      registry.register('testAction', action);
      expect(registry.has('testAction')).toBe(true);
    });
  });

  // ==================== clearActionRegistry ====================

  describe('clearActionRegistry', () => {
    it('should clear all registered actions from global registry', async () => {
      const action = vi.fn().mockResolvedValue({});
      registerAction('testAction', action);

      clearActionRegistry();

      await expect(invokeAction('testAction', {})).rejects.toThrow(ActionNotFoundError);
    });

    it('should allow re-registration after clear', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();

      registerAction('testAction', action1);
      clearActionRegistry();

      expect(() => registerAction('testAction', action2)).not.toThrow();
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle action names with unicode characters', async () => {
      const action = vi.fn().mockResolvedValue({ unicode: true });
      registerAction('アクション', action);

      const result = await invokeAction('アクション', {});
      expect(result).toEqual({ unicode: true });
    });

    it('should handle very long action names', async () => {
      const longName = 'a'.repeat(1000);
      const action = vi.fn().mockResolvedValue({});

      registerAction(longName, action);
      await invokeAction(longName, {});
      expect(action).toHaveBeenCalled();
    });

    it('should handle deeply nested input/output', async () => {
      let deep: unknown = { value: 'bottom' };
      for (let i = 0; i < 50; i++) {
        deep = { nested: deep };
      }

      const action = vi.fn().mockResolvedValue(deep);
      registerAction('deepAction', action);

      const result = await invokeAction('deepAction', deep);
      expect(result).toEqual(deep);
    });

    it('should handle large input/output objects', async () => {
      const largeObject: Record<string, number> = {};
      for (let i = 0; i < 10000; i++) {
        largeObject[`key${i}`] = i;
      }

      const action = vi.fn().mockResolvedValue(largeObject);
      registerAction('largeAction', action);

      const result = await invokeAction('largeAction', largeObject);
      expect(result).toEqual(largeObject);
    });

    it('should handle concurrent action invocations', async () => {
      let counter = 0;
      const action = vi.fn().mockImplementation(async () => {
        const current = ++counter;
        await new Promise((r) => setTimeout(r, 10));
        return { count: current };
      });

      registerAction('concurrentAction', action);

      const results = await Promise.all([
        invokeAction('concurrentAction', {}),
        invokeAction('concurrentAction', {}),
        invokeAction('concurrentAction', {}),
      ]);

      expect(results).toHaveLength(3);
      expect(action).toHaveBeenCalledTimes(3);
    });

    it('should handle action that returns array', async () => {
      const action = vi.fn().mockResolvedValue([1, 2, 3, 'four', null]);
      registerAction('arrayAction', action);

      const result = await invokeAction('arrayAction', []);
      expect(result).toEqual([1, 2, 3, 'four', null]);
    });

    it('should handle input as array', async () => {
      const action = vi.fn().mockResolvedValue({ received: true });
      registerAction('arrayInputAction', action);

      await invokeAction('arrayInputAction', [1, 2, 3]);
      expect(action).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should handle null input', async () => {
      const action = vi.fn().mockResolvedValue({});
      registerAction('nullInputAction', action);

      await invokeAction('nullInputAction', null);
      expect(action).toHaveBeenCalledWith(null);
    });
  });

  // ==================== Error Classes ====================

  describe('ActionNotFoundError', () => {
    it('should be instance of Error', () => {
      const error = new ActionNotFoundError('testAction');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ActionNotFoundError);
    });

    it('should contain action name', () => {
      const error = new ActionNotFoundError('missingAction');
      expect(error.actionName).toBe('missingAction');
    });

    it('should have descriptive message', () => {
      const error = new ActionNotFoundError('missingAction');
      expect(error.message).toContain('missingAction');
    });
  });
});
