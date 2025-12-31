"use server";

/**
 * Server Component: GreetingServer
 *
 * Demonstrates:
 * - Server-only component with "use server" directive
 * - Using invokeAction to call registered server actions
 * - Returning serializable payload for client consumption
 */

import { invokeAction } from '@capsulersc/core';
import { renderToPayload, type ServerElement } from '@capsulersc/runtime';
import type { GetGreetingInput, GetGreetingOutput } from '../../shared/types.js';

// Render a greeting as a serializable payload
export async function renderGreeting(input: GetGreetingInput) {
  // Invoke the registered action
  const result = await invokeAction<GetGreetingOutput>('getGreeting', input);

  // Create a server element structure
  const element: ServerElement = {
    type: 'GreetingCard',
    props: {
      message: result.message,
      timestamp: result.timestamp,
      userName: input.name,
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
    ],
  };

  // Convert to serializable payload (validates all props)
  return renderToPayload(element);
}

// Export the input type for consumers
export type { GetGreetingInput };
