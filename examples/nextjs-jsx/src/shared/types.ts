/**
 * Shared types between server and client.
 * No directive - can be imported from anywhere.
 */

import type { Serializable } from '@capsulersc/core';

// Input/Output types for server actions
export interface GetGreetingInput {
  name: string;
  locale?: string;
}

export interface GetGreetingOutput {
  message: string;
  timestamp: number;
}

// User data structure (serializable)
export interface UserData {
  id: string;
  name: string;
  email: string;
}

// Generic API response - demonstrates Serializable type constraint
export interface ApiResponse<T extends Serializable> {
  success: boolean;
  data: T | null;
  error: string | null;
}
