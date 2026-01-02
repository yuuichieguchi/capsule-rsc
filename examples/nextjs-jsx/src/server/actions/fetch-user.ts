"use server";

/**
 * Server action: fetchUser
 *
 * Demonstrates:
 * - HttpCapability for secure HTTP requests with host allowlist
 * - LogCapability for structured logging
 * - Input validation
 * - Proper error handling with HttpError
 */

import {
  registerAction,
  LogCapability,
  HttpCapability,
  HttpError,
} from '@capsulersc/core';

// Create capabilities for this module
const log = new LogCapability();

// HttpCapability with allowlist - only these hosts are allowed
const http = new HttpCapability({
  allowedHosts: ['jsonplaceholder.typicode.com'],
  timeout: 5000,
});

/**
 * User data from the API
 */
interface FetchUserInput {
  userId: number;
}

interface UserData {
  id: number;
  name: string;
  username: string;
  email: string;
}

/**
 * Validate input for fetchUser action
 */
function validateFetchUserInput(input: unknown): FetchUserInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input: expected object');
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.userId !== 'number') {
    throw new Error('Invalid input: userId must be a number');
  }
  return { userId: obj.userId };
}

/**
 * Fetch user data from JSONPlaceholder API
 * This demonstrates HttpCapability for secure external API calls
 */
async function fetchUserHandler(input: unknown): Promise<UserData> {
  const { userId } = validateFetchUserInput(input);

  log.info('Fetching user data', { userId });

  try {
    // Use HttpCapability.get() for secure HTTP requests
    // Only hosts in allowedHosts are permitted
    const user = await http.get<UserData>(
      `https://jsonplaceholder.typicode.com/users/${userId}`
    );

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    log.info('User data fetched successfully', {
      userId: user.id,
      username: user.username,
    });

    // Return only serializable data
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
    };
  } catch (error) {
    // Log and re-throw HttpError for proper error handling
    if (error instanceof HttpError) {
      log.info('HTTP error occurred', {
        message: error.message,
        statusCode: error.statusCode ?? 0,
      });
    }
    throw error;
  }
}

// Register the action
registerAction('fetchUser', fetchUserHandler);
