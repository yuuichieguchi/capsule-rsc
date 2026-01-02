"use server";

/**
 * Server action: getGreeting
 *
 * Demonstrates:
 * - Registering a server action with registerAction
 * - Using LogCapability for logging (not console.log directly)
 * - Input validation for unknown input
 * - Proper serializable input/output
 */

import { registerAction, LogCapability } from '@capsulersc/core';
import type { GetGreetingInput, GetGreetingOutput } from '../../shared/types';

// Create a log capability for this module
const log = new LogCapability();

/**
 * Validate unknown input to GetGreetingInput
 * This is a best practice when handling unknown input from action handlers
 */
function validateGetGreetingInput(input: unknown): GetGreetingInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input: expected object');
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.name !== 'string') {
    throw new Error('Invalid input: name must be a string');
  }
  const result: GetGreetingInput = { name: obj.name };
  if (typeof obj.locale === 'string') {
    result.locale = obj.locale;
  }
  return result;
}

// Define the server action handler
async function getGreetingHandler(input: unknown): Promise<GetGreetingOutput> {
  // Validate input before using
  const { name, locale } = validateGetGreetingInput(input);

  // Use LogCapability for logging (not console.log directly)
  log.info('Processing greeting request', { name, locale: locale ?? 'en' });

  // Generate greeting based on locale
  const greetings: Record<string, string> = {
    en: `Hello, ${name}!`,
    ja: `\u3053\u3093\u306b\u3061\u306f\u3001${name}\u3055\u3093\uff01`,
    es: `\u00a1Hola, ${name}!`,
    fr: `Bonjour, ${name}!`,
    de: `Hallo, ${name}!`,
  };

  const message = greetings[locale ?? 'en'] ?? greetings['en'] ?? `Hello, ${name}!`;

  log.info('Greeting generated', { message });

  return {
    message,
    timestamp: Date.now(),
  };
}

// Register the action with @capsulersc/core
registerAction('getGreeting', getGreetingHandler);
