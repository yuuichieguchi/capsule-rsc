import type { SerializablePayload } from '../server/payload-types.js';
import { hydratePayload, type HydrationResult } from './hydrate.js';

/**
 * Processes a SerializablePayload and returns a HydrationResult.
 * This is a simple wrapper around hydratePayload for MVP.
 *
 * @param payload - The serializable payload to process
 * @returns A hydrated result, or a default empty result for null/undefined
 *
 * @example
 * ```typescript
 * const payload: SerializablePayload = {
 *   type: 'UserCard',
 *   props: { name: 'Alice', age: 30 },
 *   children: [{ type: 'Avatar', props: { src: '/avatar.png' } }]
 * };
 *
 * const result = processPayload(payload);
 * console.log(result.type); // 'UserCard'
 * console.log(result.children[0].type); // 'Avatar'
 * ```
 */
export function processPayload(payload: SerializablePayload | null | undefined): HydrationResult {
  // Handle null/undefined gracefully by returning a default empty result
  if (payload === null || payload === undefined) {
    return {
      type: '',
      props: {},
      children: [],
    };
  }

  return hydratePayload(payload);
}
