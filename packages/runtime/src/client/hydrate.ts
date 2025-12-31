import type { SerializablePayload } from '../server/payload-types.js';

/**
 * Represents the result of hydrating a SerializablePayload.
 * This structure is guaranteed to always have a children array.
 */
export interface HydrationResult {
  type: string;
  props: Record<string, unknown>;
  children: HydrationResult[];
}

/**
 * Hydrates a SerializablePayload back to a usable structure.
 * The result always has a children array (empty if no children in payload).
 *
 * @param payload - The serializable payload to hydrate
 * @returns A hydrated result with guaranteed children array
 *
 * @example
 * ```typescript
 * import { hydratePayload } from '@capsulersc/runtime';
 *
 * // Received from server as JSON
 * const json = '{"type":"UserCard","props":{"name":"Alice"},"children":[]}';
 * const payload = JSON.parse(json) as SerializablePayload;
 *
 * const result = hydratePayload(payload);
 * console.log(result.type);     // 'UserCard'
 * console.log(result.props);    // { name: 'Alice' }
 * console.log(result.children); // [] (always an array)
 * ```
 */
export function hydratePayload(payload: SerializablePayload): HydrationResult {
  return {
    type: payload.type,
    // Shallow copy: top-level props are copied, but nested objects share references.
    // For deep cloning, use structuredClone() on the result if needed.
    props: { ...payload.props } as Record<string, unknown>,
    children: payload.children
      ? payload.children.map(child => hydratePayload(child))
      : [],
  };
}

/**
 * Hydrates a JSON string back to a HydrationResult.
 * This is a convenience wrapper that parses JSON and calls hydratePayload.
 *
 * @param json - The JSON string to parse and hydrate
 * @returns A hydrated result with guaranteed children array
 * @throws SyntaxError if the JSON is invalid
 *
 * @example
 * ```typescript
 * import { hydrateFromString } from '@capsulersc/runtime';
 *
 * // Received from server as JSON string
 * const json = '{"type":"UserCard","props":{"name":"Alice"},"children":[]}';
 *
 * const result = hydrateFromString(json);
 * console.log(result.type);     // 'UserCard'
 * console.log(result.props);    // { name: 'Alice' }
 * console.log(result.children); // [] (always an array)
 * ```
 */
export function hydrateFromString(json: string): HydrationResult {
  const payload = JSON.parse(json) as SerializablePayload;
  return hydratePayload(payload);
}
