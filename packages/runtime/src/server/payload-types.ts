import type { Serializable } from '@capsulersc/core';

/**
 * A serializable object structure (maps string keys to serializable values).
 */
export type SerializableObject = { [key: string]: Serializable };

/**
 * Represents a serializable payload structure that can be sent from server to client.
 * This is the wire format for component trees.
 */
export interface SerializablePayload {
  type: string;
  props: SerializableObject;
  children?: SerializablePayload[];
}

/**
 * Represents a server-side element before serialization.
 * Props can contain any values, which will be validated during rendering.
 */
export interface ServerElement {
  type: string;
  props: Record<string, unknown>;
  children?: ServerElement[];
}

/**
 * Type guard to check if a value is a valid SerializablePayload.
 * Validates the structure recursively including children.
 */
export function isSerializablePayload(value: unknown): value is SerializablePayload {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  // Arrays are not valid payloads
  if (Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Must have string type
  if (typeof obj.type !== 'string') {
    return false;
  }

  // Must have props as a non-null, non-array object
  if (obj.props === null || typeof obj.props !== 'object' || Array.isArray(obj.props)) {
    return false;
  }

  // Children must be undefined or an array
  if (obj.children !== undefined) {
    if (!Array.isArray(obj.children)) {
      return false;
    }

    // Recursively validate all children
    for (const child of obj.children) {
      if (!isSerializablePayload(child)) {
        return false;
      }
    }
  }

  return true;
}
