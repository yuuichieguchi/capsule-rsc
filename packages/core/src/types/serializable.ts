/**
 * Represents a value that can be safely serialized to JSON.
 * This type is used for validating data that crosses boundaries
 * (e.g., client-server, action input/output).
 */
export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };
