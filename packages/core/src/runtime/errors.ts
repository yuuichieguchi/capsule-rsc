/**
 * Error thrown when a value cannot be serialized.
 */
export class SerializationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'SerializationError';
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SerializationError.prototype);
  }
}

/**
 * Error thrown when attempting to invoke an unregistered action.
 */
export class ActionNotFoundError extends Error {
  constructor(public readonly actionName: string) {
    super(`Action not found: ${actionName}`);
    this.name = 'ActionNotFoundError';
    Object.setPrototypeOf(this, ActionNotFoundError.prototype);
  }
}

/**
 * Error thrown for HTTP-related failures.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly url?: string
  ) {
    super(message);
    this.name = 'HttpError';
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * Error thrown when an HTTP request times out.
 */
export class HttpTimeoutError extends HttpError {
  constructor(
    message: string,
    url: string,
    public readonly timeout: number
  ) {
    super(message, undefined, url);
    this.name = 'HttpTimeoutError';
    Object.setPrototypeOf(this, HttpTimeoutError.prototype);
  }
}
