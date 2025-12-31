import { assertSerializable } from '../runtime/assert-serializable.js';
import { HttpError, HttpTimeoutError } from '../runtime/errors.js';

/**
 * Options for configuring HttpCapability.
 */
export interface HttpCapabilityOptions {
  /**
   * List of allowed hostnames. Supports wildcard subdomains.
   *
   * Examples:
   * - `"api.example.com"` - exact match only
   * - `"*.example.com"` - matches subdomains like "api.example.com", "www.example.com"
   *   but NOT "example.com" itself. Add both `"example.com"` and `"*.example.com"`
   *   if you need to allow the root domain as well.
   */
  allowedHosts: string[];
  /**
   * Default timeout in milliseconds (default: 30000).
   */
  timeout?: number;
}

/**
 * Options for HTTP requests.
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Options for HTTP POST requests.
 */
export interface HttpPostOptions extends HttpRequestOptions {
  body?: unknown;
}

const DEFAULT_TIMEOUT = 30000;
const ALLOWED_METHODS = new Set(['GET', 'POST']);

/**
 * Capability for making HTTP requests with host allowlist and timeout support.
 * 
 * Only GET and POST methods are allowed in MVP.
 */
export class HttpCapability {
  private readonly allowedHosts: string[];
  private readonly defaultTimeout: number;

  constructor(options: HttpCapabilityOptions) {
    this.allowedHosts = options.allowedHosts;
    this.defaultTimeout = options.timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * Makes a GET request.
   *
   * @param url - The URL to fetch
   * @param options - Optional request options
   * @returns Parsed JSON response, or null for empty responses (204 No Content)
   */
  async get<T>(url: string, options?: HttpRequestOptions): Promise<T | null> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Makes a POST request.
   *
   * @param url - The URL to post to
   * @param options - Optional request options including body
   * @returns Parsed JSON response, or null for empty responses (204 No Content)
   */
  async post<T>(url: string, options?: HttpPostOptions): Promise<T | null> {
    return this.request<T>(url, { ...options, method: 'POST' });
  }

  /**
   * Makes an HTTP request with the specified method.
   *
   * @param url - The URL to request
   * @param options - Request options including method
   * @returns Parsed JSON response, or null for empty responses (204 No Content)
   */
  async request<T>(url: string, options: HttpRequestOptions & { method: string; body?: unknown }): Promise<T | null> {
    const method = options.method.toUpperCase();

    // Validate method
    if (!ALLOWED_METHODS.has(method)) {
      throw new HttpError(`Method ${method} is not allowed. Only GET and POST are supported.`, undefined, url);
    }

    // Validate URL and host
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new HttpError(`Invalid URL: ${url}`, undefined, url);
    }

    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new HttpError(`Protocol ${parsedUrl.protocol} is not allowed`, undefined, url);
    }

    if (!this.isHostAllowed(parsedUrl.host)) {
      throw new HttpError(`Host ${parsedUrl.host} is not in the allowlist`, undefined, url);
    }

    // Build headers
    const headers: Record<string, string> = { ...options.headers };

    // Build request options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Handle body for POST requests
    if (options.body !== undefined) {
      assertSerializable(options.body, 'body');
      fetchOptions.body = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
    }

    // Setup timeout using Promise.race for better compatibility with mocks/fake timers
    const timeout = options.timeout ?? this.defaultTimeout;
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(
          new HttpTimeoutError(
            `Request to ${url} timed out after ${timeout}ms`,
            url,
            timeout
          )
        );
      }, timeout);
    });

    fetchOptions.signal = controller.signal;

    try {
      // Race between fetch and timeout
      const response = await Promise.race([fetch(url, fetchOptions), timeoutPromise]);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      // Handle non-OK responses
      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }

      // Handle empty response (204 No Content)
      if (response.status === 204) {
        return null as T;
      }

      // Clone response before reading body to support reused Response objects in tests
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      if (!text) {
        return null as T;
      }

      // Parse JSON
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new HttpError(`Invalid JSON response from ${url}`, response.status, url);
      }
    } catch (error) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      // Re-throw our own errors
      if (error instanceof HttpError) {
        throw error;
      }

      // Handle abort (timeout) - might occur if AbortController works with real fetch
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpTimeoutError(
          `Request to ${url} timed out after ${timeout}ms`,
          url,
          timeout
        );
      }

      // Handle other errors
      throw new HttpError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        url
      );
    }
  }

  /**
   * Checks if a host is allowed based on the allowlist.
   * Supports wildcard matching (e.g., "*.example.com" matches "api.example.com").
   */
  private isHostAllowed(host: string): boolean {
    for (const pattern of this.allowedHosts) {
      if (pattern.startsWith('*.')) {
        // Wildcard matching
        const suffix = pattern.slice(1); // Remove * but keep the dot
        if (host.endsWith(suffix) && host.length > suffix.length) {
          return true;
        }
      } else {
        // Exact match
        if (host === pattern) {
          return true;
        }
      }
    }
    return false;
  }
}
