"use server";

/**
 * Server Component: GreetingServer
 *
 * Demonstrates:
 * - Server-only component with "use server" directive
 * - Using invokeAction to call registered server actions
 * - Using renderToPayload to create serializable payload
 * - Building ServerElement tree structure
 * - Using assertSerializable for explicit validation
 */

import { invokeAction, assertSerializable } from '@capsulersc/core';
import {
  renderToPayload,
  type ServerElement,
  type SerializablePayload,
} from '@capsulersc/runtime';
import type { GetGreetingInput, GetGreetingOutput } from '../../shared/types';

/**
 * Side-effect import pattern:
 * This import registers the 'getGreeting' action in the global registry.
 * Without this import, invokeAction('getGreeting', ...) would fail with
 * ActionNotFoundError because the action wouldn't be registered.
 *
 * This pattern is necessary because:
 * 1. Action registration happens when the module is loaded
 * 2. If nothing imports the action file, it won't be loaded
 * 3. This import ensures the action is available before we call it
 */
import '../actions/get-greeting';

/**
 * Render a greeting as a serializable payload
 * This function runs on the server and produces data that can be sent to the client
 */
export async function renderGreeting(
  input: GetGreetingInput
): Promise<SerializablePayload> {
  // Use invokeAction to call the registered action
  const result = await invokeAction<GetGreetingOutput>('getGreeting', input);

  // Build ServerElement tree structure
  const element: ServerElement = {
    type: 'GreetingCard',
    props: {
      message: result.message,
      timestamp: result.timestamp,
      userName: input.name,
      locale: input.locale ?? 'en',
    },
    children: [
      {
        type: 'MessageText',
        props: { text: result.message },
      },
      {
        type: 'Timestamp',
        props: { value: result.timestamp },
      },
      {
        type: 'LocaleInfo',
        props: { locale: input.locale ?? 'en' },
      },
    ],
  };

  // Convert to serializable payload using @capsulersc/runtime
  // renderToPayload internally validates, but we can also use assertSerializable
  // explicitly for additional validation before sending to client
  const payload = renderToPayload(element);

  // Explicit validation using assertSerializable from @capsulersc/core
  // This throws SerializationError if the payload contains non-serializable data
  assertSerializable(payload, 'greetingPayload');

  return payload;
}
