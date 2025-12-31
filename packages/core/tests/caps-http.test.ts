/**
 * Test suite for HttpCapability
 *
 * Coverage:
 * - Host allowlist validation
 * - Method restriction (GET/POST only)
 * - Timeout behavior
 * - Request/Response handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpCapability, HttpError, HttpTimeoutError } from '../src/index.js';

describe('HttpCapability', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // ==================== Constructor ====================

  describe('constructor', () => {
    it('should create HttpCapability with allowed hosts', () => {
      const http = new HttpCapability({ allowedHosts: ['api.example.com'] });
      expect(http).toBeInstanceOf(HttpCapability);
    });

    it('should create HttpCapability with multiple allowed hosts', () => {
      const http = new HttpCapability({
        allowedHosts: ['api.example.com', 'cdn.example.com', 'auth.example.com'],
      });
      expect(http).toBeInstanceOf(HttpCapability);
    });

    it('should create HttpCapability with empty allowed hosts (all blocked)', () => {
      const http = new HttpCapability({ allowedHosts: [] });
      expect(http).toBeInstanceOf(HttpCapability);
    });

    it('should create HttpCapability with timeout option', () => {
      const http = new HttpCapability({
        allowedHosts: ['api.example.com'],
        timeout: 5000,
      });
      expect(http).toBeInstanceOf(HttpCapability);
    });
  });

  // ==================== Host Allowlist Validation ====================

  describe('host allowlist validation', () => {
    let http: HttpCapability;

    beforeEach(() => {
      http = new HttpCapability({
        allowedHosts: ['api.example.com', 'cdn.example.org'],
      });
      mockFetch.mockResolvedValue(new Response('{}'));
    });

    describe('allowed hosts', () => {
      it('should allow request to host in allowlist', async () => {
        await http.get('https://api.example.com/data');
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should allow request to second host in allowlist', async () => {
        await http.get('https://cdn.example.org/assets/image.png');
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should allow request with different paths on allowed host', async () => {
        await http.get('https://api.example.com/users/123');
        await http.get('https://api.example.com/posts');
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('should allow request with query parameters on allowed host', async () => {
        await http.get('https://api.example.com/search?q=test&page=1');
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should allow request with port on allowed host', async () => {
        const httpWithPort = new HttpCapability({
          allowedHosts: ['api.example.com:8080'],
        });
        await httpWithPort.get('https://api.example.com:8080/data');
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('disallowed hosts', () => {
      it('should throw HttpError for host not in allowlist', async () => {
        await expect(http.get('https://malicious.com/steal')).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for subdomain of allowed host', async () => {
        await expect(http.get('https://sub.api.example.com/data')).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for similar but different host', async () => {
        await expect(http.get('https://api.example.com.evil.com/data')).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for localhost', async () => {
        await expect(http.get('http://localhost:3000/api')).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for IP address', async () => {
        await expect(http.get('http://192.168.1.1/admin')).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for file protocol', async () => {
        await expect(http.get('file:///etc/passwd')).rejects.toThrow(HttpError);
      });

      it('should not call fetch for disallowed host', async () => {
        try {
          await http.get('https://malicious.com/data');
        } catch {
          // Expected to throw
        }
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe('empty allowlist', () => {
      it('should block all requests when allowlist is empty', async () => {
        const httpEmpty = new HttpCapability({ allowedHosts: [] });
        await expect(httpEmpty.get('https://any.host.com/data')).rejects.toThrow(HttpError);
      });
    });

    describe('wildcard hosts', () => {
      it('should support wildcard subdomain matching', async () => {
        const httpWildcard = new HttpCapability({
          allowedHosts: ['*.example.com'],
        });
        await httpWildcard.get('https://api.example.com/data');
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should allow any subdomain with wildcard', async () => {
        const httpWildcard = new HttpCapability({
          allowedHosts: ['*.example.com'],
        });
        await httpWildcard.get('https://cdn.example.com/assets');
        await httpWildcard.get('https://auth.example.com/login');
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==================== Method Restriction ====================

  describe('method restriction', () => {
    let http: HttpCapability;

    beforeEach(() => {
      http = new HttpCapability({ allowedHosts: ['api.example.com'] });
      mockFetch.mockResolvedValue(new Response('{}'));
    });

    describe('allowed methods', () => {
      it('should allow GET requests', async () => {
        await http.get('https://api.example.com/data');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ method: 'GET' })
        );
      });

      it('should allow POST requests', async () => {
        await http.post('https://api.example.com/data', { body: { key: 'value' } });
        expect(mockFetch).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    describe('disallowed methods', () => {
      it('should throw HttpError for PUT requests', async () => {
        await expect(
          http.request('https://api.example.com/data', { method: 'PUT' })
        ).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for DELETE requests', async () => {
        await expect(
          http.request('https://api.example.com/data', { method: 'DELETE' })
        ).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for PATCH requests', async () => {
        await expect(
          http.request('https://api.example.com/data', { method: 'PATCH' })
        ).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for HEAD requests', async () => {
        await expect(
          http.request('https://api.example.com/data', { method: 'HEAD' })
        ).rejects.toThrow(HttpError);
      });

      it('should throw HttpError for OPTIONS requests', async () => {
        await expect(
          http.request('https://api.example.com/data', { method: 'OPTIONS' })
        ).rejects.toThrow(HttpError);
      });

      it('should not call fetch for disallowed methods', async () => {
        try {
          await http.request('https://api.example.com/data', { method: 'DELETE' });
        } catch {
          // Expected to throw
        }
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe('method case sensitivity', () => {
      it('should handle lowercase method names', async () => {
        await http.request('https://api.example.com/data', { method: 'get' as 'GET' });
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should handle mixed case method names', async () => {
        await http.request('https://api.example.com/data', { method: 'Get' as 'GET' });
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  // ==================== Timeout Behavior ====================

  describe('timeout behavior', () => {
    let http: HttpCapability;

    beforeEach(() => {
      vi.useFakeTimers();
      http = new HttpCapability({
        allowedHosts: ['api.example.com'],
        timeout: 5000,
      });
    });

    it('should abort request after timeout', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(new Response('{}')), 10000);
          })
      );

      const requestPromise = http.get('https://api.example.com/slow');
      vi.advanceTimersByTime(5001);

      await expect(requestPromise).rejects.toThrow(HttpTimeoutError);
    });

    it('should complete request before timeout', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(new Response('{"success": true}')), 1000);
          })
      );

      const requestPromise = http.get('https://api.example.com/fast');
      vi.advanceTimersByTime(1001);

      const response = await requestPromise;
      expect(response).toBeDefined();
    });

    it('should use default timeout when not specified', async () => {
      const httpDefault = new HttpCapability({
        allowedHosts: ['api.example.com'],
      });

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(new Response('{}')), 60000);
          })
      );

      const requestPromise = httpDefault.get('https://api.example.com/data');
      vi.advanceTimersByTime(30001); // Default should be 30 seconds

      await expect(requestPromise).rejects.toThrow(HttpTimeoutError);
    });

    it('should allow custom timeout per request', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(new Response('{}')), 3000);
          })
      );

      const requestPromise = http.get('https://api.example.com/data', { timeout: 2000 });
      vi.advanceTimersByTime(2001);

      await expect(requestPromise).rejects.toThrow(HttpTimeoutError);
    });

    it('should include timeout duration in error message', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const requestPromise = http.get('https://api.example.com/slow');
      vi.advanceTimersByTime(5001);

      await expect(requestPromise).rejects.toThrow(/5000/);
    });
  });

  // ==================== GET Requests ====================

  describe('GET requests', () => {
    let http: HttpCapability;

    beforeEach(() => {
      http = new HttpCapability({ allowedHosts: ['api.example.com'] });
    });

    it('should send GET request to correct URL', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));
      await http.get('https://api.example.com/users/123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return parsed JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('{"id": 123, "name": "John"}'));
      const result = await http.get('https://api.example.com/user');
      expect(result).toEqual({ id: 123, name: 'John' });
    });

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));
      await http.get('https://api.example.com/data', {
        headers: { Authorization: 'Bearer token123' },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token123' }),
        })
      );
    });

    it('should throw HttpError on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      await expect(http.get('https://api.example.com/data')).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on non-OK response', async () => {
      mockFetch.mockResolvedValue(new Response('Not Found', { status: 404 }));
      await expect(http.get('https://api.example.com/missing')).rejects.toThrow(HttpError);
    });
  });

  // ==================== POST Requests ====================

  describe('POST requests', () => {
    let http: HttpCapability;

    beforeEach(() => {
      http = new HttpCapability({ allowedHosts: ['api.example.com'] });
    });

    it('should send POST request with JSON body', async () => {
      mockFetch.mockResolvedValue(new Response('{"created": true}'));
      await http.post('https://api.example.com/users', {
        body: { name: 'John', email: 'john@example.com' },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
        })
      );
    });

    it('should set Content-Type header for JSON', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));
      await http.post('https://api.example.com/data', { body: { key: 'value' } });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('should return parsed JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('{"id": 456, "status": "created"}'));
      const result = await http.post('https://api.example.com/items', {
        body: { name: 'New Item' },
      });
      expect(result).toEqual({ id: 456, status: 'created' });
    });

    it('should allow POST without body', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));
      await http.post('https://api.example.com/trigger');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw HttpError on server error', async () => {
      mockFetch.mockResolvedValue(new Response('Internal Server Error', { status: 500 }));
      await expect(
        http.post('https://api.example.com/data', { body: { key: 'value' } })
      ).rejects.toThrow(HttpError);
    });
  });

  // ==================== Response Handling ====================

  describe('response handling', () => {
    let http: HttpCapability;

    beforeEach(() => {
      http = new HttpCapability({ allowedHosts: ['api.example.com'] });
    });

    it('should parse JSON response correctly', async () => {
      mockFetch.mockResolvedValue(
        new Response('{"nested": {"array": [1, 2, 3]}}')
      );
      const result = await http.get('https://api.example.com/data');
      expect(result).toEqual({ nested: { array: [1, 2, 3] } });
    });

    it('should handle empty response body', async () => {
      // Note: HTTP 204 is a "null body status" in Node.js, must use null not ''
      mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
      const result = await http.get('https://api.example.com/data');
      expect(result).toBeNull();
    });

    it('should handle null JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('null'));
      const result = await http.get('https://api.example.com/data');
      expect(result).toBeNull();
    });

    it('should throw HttpError on invalid JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('not valid json {'));
      await expect(http.get('https://api.example.com/data')).rejects.toThrow(HttpError);
    });
  });

  // ==================== Error Classes ====================

  describe('HttpError', () => {
    it('should be instance of Error', () => {
      const error = new HttpError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HttpError);
    });

    it('should contain status code when available', async () => {
      const http = new HttpCapability({ allowedHosts: ['api.example.com'] });
      mockFetch.mockResolvedValue(new Response('Not Found', { status: 404 }));

      try {
        await http.get('https://api.example.com/missing');
      } catch (e) {
        expect((e as HttpError).statusCode).toBe(404);
      }
    });

    it('should contain URL in error', async () => {
      const http = new HttpCapability({ allowedHosts: ['api.example.com'] });
      mockFetch.mockResolvedValue(new Response('Error', { status: 500 }));

      try {
        await http.get('https://api.example.com/error');
      } catch (e) {
        expect((e as HttpError).url).toBe('https://api.example.com/error');
      }
    });
  });

  describe('HttpTimeoutError', () => {
    it('should be instance of HttpError', () => {
      const error = new HttpTimeoutError('Timeout', 'https://example.com', 5000);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(HttpTimeoutError);
    });

    it('should contain timeout duration', () => {
      const error = new HttpTimeoutError('Timeout', 'https://example.com', 5000);
      expect(error.timeout).toBe(5000);
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    let http: HttpCapability;

    beforeEach(() => {
      http = new HttpCapability({ allowedHosts: ['api.example.com'] });
      mockFetch.mockResolvedValue(new Response('{}'));
    });

    it('should handle URL with special characters', async () => {
      await http.get('https://api.example.com/search?q=hello%20world');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle URL with unicode', async () => {
      await http.get('https://api.example.com/search?q=%E6%97%A5%E6%9C%AC%E8%AA%9E');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle very long URL', async () => {
      const longPath = 'a'.repeat(2000);
      await http.get(`https://api.example.com/${longPath}`);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        http.get('https://api.example.com/1'),
        http.get('https://api.example.com/2'),
        http.get('https://api.example.com/3'),
      ];
      await Promise.all(promises);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should reject invalid URL format', async () => {
      await expect(http.get('not-a-valid-url')).rejects.toThrow();
    });
  });
});
