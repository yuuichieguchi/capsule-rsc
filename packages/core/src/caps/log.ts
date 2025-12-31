import { assertSerializable } from '../runtime/assert-serializable.js';
import type { Serializable } from '../types/serializable.js';

/**
 * Capability for logging with serializable metadata.
 *
 * This class provides structured logging methods that enforce
 * serialization constraints on metadata to ensure logs can be
 * safely transmitted and stored.
 */
export class LogCapability {
  /**
   * Log an informational message.
   * @param message - The log message
   */
  info(message: string): void;
  /**
   * Log an informational message with metadata.
   * @param message - The log message
   * @param meta - Serializable metadata
   */
  info(message: string, meta: Serializable): void;
  /**
   * Implementation
   */
  info(message: string, meta?: unknown): void {
    if (arguments.length > 1) {
      assertSerializable(meta, 'meta');
      console.log(message, meta);
    } else {
      console.log(message);
    }
  }

  /**
   * Log a warning message.
   * @param message - The warning message
   */
  warn(message: string): void;
  /**
   * Log a warning message with metadata.
   * @param message - The warning message
   * @param meta - Serializable metadata
   */
  warn(message: string, meta: Serializable): void;
  /**
   * Implementation
   */
  warn(message: string, meta?: unknown): void {
    if (arguments.length > 1) {
      assertSerializable(meta, 'meta');
      console.warn(message, meta);
    } else {
      console.warn(message);
    }
  }

  /**
   * Log an error message.
   * @param message - The error message
   */
  error(message: string): void;
  /**
   * Log an error message with metadata.
   * @param message - The error message
   * @param meta - Serializable metadata
   */
  error(message: string, meta: Serializable): void;
  /**
   * Implementation
   */
  error(message: string, meta?: unknown): void {
    if (arguments.length > 1) {
      assertSerializable(meta, 'meta');
      console.error(message, meta);
    } else {
      console.error(message);
    }
  }
}
