import { assertSerializable } from '@capsulersc/core';
import type { ServerElement, SerializablePayload, SerializableObject } from './payload-types.js';

/**
 * Renders a ServerElement tree to a SerializablePayload.
 * Validates that all props are serializable and throws SerializationError if not.
 *
 * @param element - The server element to render
 * @returns A serializable payload that can be sent to the client
 * @throws SerializationError if any prop contains non-serializable values
 *
 * @example
 * ```typescript
 * import { renderToPayload } from '@capsulersc/runtime';
 *
 * const element: ServerElement = {
 *   type: 'UserCard',
 *   props: { name: 'Alice', age: 30 },
 *   children: [
 *     { type: 'Avatar', props: { src: '/avatar.png' } }
 *   ]
 * };
 *
 * const payload = renderToPayload(element);
 * // payload can now be JSON.stringify'd and sent to client
 * const json = JSON.stringify(payload);
 * ```
 */
export function renderToPayload(element: ServerElement): SerializablePayload {
  // Validate props are serializable
  assertSerializable(element.props);

  const payload: SerializablePayload = {
    type: element.type,
    props: element.props as SerializableObject,
  };

  // Only include children if they exist and are non-empty, OR if it's an empty array
  if (element.children !== undefined) {
    payload.children = element.children.map(child => renderToPayload(child));
  }

  return payload;
}

/**
 * Renders a ServerElement tree to a JSON string.
 * This is a convenience wrapper around renderToPayload that also serializes to JSON.
 *
 * @param element - The server element to render
 * @returns A JSON string representation of the payload
 * @throws SerializationError if any prop contains non-serializable values
 *
 * @example
 * ```typescript
 * import { renderToString } from '@capsulersc/runtime';
 *
 * const element: ServerElement = {
 *   type: 'UserCard',
 *   props: { name: 'Alice', age: 30 },
 *   children: []
 * };
 *
 * const json = renderToString(element);
 * // json can be sent directly over the network
 * ```
 */
export function renderToString(element: ServerElement): string {
  const payload = renderToPayload(element);
  return JSON.stringify(payload);
}
