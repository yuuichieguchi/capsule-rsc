"use server";

/**
 * Server action: getGreeting
 *
 * Demonstrates:
 * - Registering a server action
 * - Using LogCapability for logging
 * - Proper serializable input/output
 */

import {
  registerAction,
  LogCapability,
} from '@capsulersc/core';
import type { GetGreetingInput, GetGreetingOutput } from '../../shared/types.js';

// Create a log capability for this module
const log = new LogCapability();

// Define the server action handler
async function getGreetingHandler(input: unknown): Promise<GetGreetingOutput> {
  const { name, locale } = input as GetGreetingInput;

  // Use LogCapability for logging (not console.log directly)
  log.info('Processing greeting request', { name });

  // Generate greeting based on locale
  let greeting: string;
  switch (locale) {
    case 'ja':
      greeting = `こんにちは、${name}さん！`;
      break;
    case 'es':
      greeting = `¡Hola, ${name}!`;
      break;
    case 'fr':
      greeting = `Bonjour, ${name}!`;
      break;
    default:
      greeting = `Hello, ${name}!`;
  }

  log.info('Greeting generated', { greeting });

  return {
    message: greeting,
    timestamp: Date.now(),
  };
}

// Register the action
registerAction('getGreeting', getGreetingHandler);

// Export types for consumers
export type { GetGreetingInput, GetGreetingOutput };
