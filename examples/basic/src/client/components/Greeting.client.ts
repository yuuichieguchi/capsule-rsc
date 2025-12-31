"use client";

/**
 * Client Component: GreetingClient
 *
 * Demonstrates:
 * - Client-only component with "use client" directive
 * - Consuming serializable payload from server
 * - Using hydratePayload to reconstruct data
 */

import { hydratePayload, type SerializablePayload } from '@capsulersc/runtime';

// Hydrate and render the greeting payload
export function renderGreetingClient(payload: SerializablePayload): string {
  const result = hydratePayload(payload);

  // Extract props from the hydrated result
  const { message, timestamp, userName } = result.props as {
    message: string;
    timestamp: number;
    userName: string;
  };

  // Format the output (in a real app, this would return JSX)
  const date = new Date(timestamp);
  return `
=== Greeting for ${userName} ===
Message: ${message}
Generated at: ${date.toISOString()}

Children:
${result.children.map(child => `  - ${child.type}: ${JSON.stringify(child.props)}`).join('\n')}
  `.trim();
}

// Client-side greeting display
export function displayGreeting(payload: SerializablePayload): void {
  const output = renderGreetingClient(payload);
  console.log(output);
}
