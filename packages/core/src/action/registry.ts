import { assertSerializable } from '../runtime/assert-serializable.js';
import { ActionNotFoundError } from '../runtime/errors.js';
import type { Serializable } from '../types/serializable.js';

/**
 * Type for action handler functions (untyped version for backward compatibility).
 */
export type ActionHandler = (input: unknown) => unknown | Promise<unknown>;

/**
 * Type for typed action handler functions.
 * Both input and output must be Serializable.
 *
 * @template TInput - The input type (must be Serializable)
 * @template TOutput - The output type (must be Serializable)
 */
export type TypedActionHandler<
  TInput extends Serializable,
  TOutput extends Serializable
> = (input: TInput) => TOutput | Promise<TOutput>;

/**
 * Type for server actions (alias for TypedActionHandler).
 * Use this when defining server actions with explicit types.
 *
 * @example
 * ```typescript
 * const getUser: ServerAction<{ id: string }, { name: string; email: string }> =
 *   async (input) => {
 *     // input is typed as { id: string }
 *     return { name: 'John', email: 'john@example.com' };
 *   };
 * ```
 */
export type ServerAction<
  TInput extends Serializable,
  TOutput extends Serializable
> = TypedActionHandler<TInput, TOutput>;

/**
 * Registry for managing server actions.
 * 
 * Actions are registered with a unique name and can be invoked
 * with serializable input. Both input and output are validated
 * to ensure they can be safely transmitted across boundaries.
 */
export class ActionRegistry {
  private readonly actions = new Map<string, ActionHandler>();

  /**
   * Registers an action handler with a unique name.
   * 
   * @param name - Unique name for the action
   * @param handler - The action handler function
   * @throws Error if the name is empty, handler is invalid, or name is already registered
   */
  register(name: string, handler: ActionHandler): void {
    if (!name || name.length === 0) {
      throw new Error('Action name cannot be empty');
    }

    if (handler === null || handler === undefined) {
      throw new Error('Action handler cannot be null or undefined');
    }

    if (typeof handler !== 'function') {
      throw new Error('Action handler must be a function');
    }

    if (this.actions.has(name)) {
      throw new Error(`Action "${name}" is already registered`);
    }

    this.actions.set(name, handler);
  }

  /**
   * Invokes a registered action with the given input.
   * 
   * @param name - The name of the action to invoke
   * @param input - The input to pass to the action (must be serializable)
   * @returns The action result (validated to be serializable)
   * @throws ActionNotFoundError if the action is not registered
   * @throws SerializationError if input or output is not serializable
   */
  async invoke<T>(name: string, input: unknown): Promise<T> {
    const handler = this.actions.get(name);

    if (!handler) {
      throw new ActionNotFoundError(name);
    }

    // Validate input
    assertSerializable(input, 'input');

    // Invoke handler
    const result = await handler(input);

    // Validate output
    assertSerializable(result, 'output');

    return result as T;
  }

  /**
   * Clears all registered actions.
   */
  clear(): void {
    this.actions.clear();
  }

  /**
   * Checks if an action is registered.
   * 
   * @param name - The name of the action to check
   * @returns true if the action is registered, false otherwise
   */
  has(name: string): boolean {
    return this.actions.has(name);
  }
}

// Default global registry
const defaultRegistry = new ActionRegistry();

/**
 * Registers an action in the global registry.
 * 
 * @param name - Unique name for the action
 * @param handler - The action handler function
 */
export function registerAction(name: string, handler: ActionHandler): void {
  defaultRegistry.register(name, handler);
}

/**
 * Invokes an action from the global registry.
 * 
 * @param name - The name of the action to invoke
 * @param input - The input to pass to the action
 * @returns The action result
 */
export function invokeAction<T>(name: string, input: unknown): Promise<T> {
  return defaultRegistry.invoke<T>(name, input);
}

/**
 * Clears all actions from the global registry.
 */
export function clearActionRegistry(): void {
  defaultRegistry.clear();
}
