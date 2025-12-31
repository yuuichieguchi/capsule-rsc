/**
 * Test suite for no-direct-fetch rule
 *
 * This rule forbids direct fetch() calls in server files.
 * Use `caps.http.get()` or similar instead.
 *
 * Coverage:
 * - Happy path: client/shared files can use fetch
 * - Server files must NOT use fetch directly
 * - Safe alternatives like caps.http.get() are allowed
 */

import { describe, it, beforeAll, afterAll } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../src/rules/no-direct-fetch.js';

// RuleTester configuration for ES modules with vitest
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('no-direct-fetch', () => {
  // ==================== Valid Cases ====================

  describe('valid cases', () => {
    ruleTester.run('no-direct-fetch', rule, {
      valid: [
        // -------------------- Client Files --------------------
        {
          name: 'client file - fetch allowed',
          code: `"use client";
fetch('https://api.example.com');`,
        },
        {
          name: 'client file - await fetch allowed',
          code: `"use client";
const response = await fetch('https://api.example.com/data');`,
        },
        {
          name: 'client file - fetch with options allowed',
          code: `"use client";
fetch('https://api.example.com', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
});`,
        },

        // -------------------- Shared Files (no directive) --------------------
        {
          name: 'shared file - fetch allowed',
          code: `// No directive - shared file
fetch('https://api.example.com');`,
        },
        {
          name: 'shared file - function using fetch allowed',
          code: `async function getData() {
  return await fetch('https://api.example.com');
}`,
        },

        // -------------------- Server Files - Safe Alternatives --------------------
        {
          name: 'server file - caps.http.get allowed',
          code: `"use server";
const data = await caps.http.get('https://api.example.com');`,
        },
        {
          name: 'server file - caps.http.post allowed',
          code: `"use server";
await caps.http.post('https://api.example.com', { data: 'value' });`,
        },
        {
          name: 'server file - local variable named fetch (not global)',
          code: `"use server";
const fetch = (url) => ({ url });
fetch('local-path');`,
        },
        {
          name: 'server file - method named fetch on object',
          code: `"use server";
const api = {
  fetch: (url) => console.log(url),
};
api.fetch('some-url');`,
        },
        {
          name: 'server file - no fetch usage',
          code: `"use server";
const data = { key: 'value' };
console.log(data);`,
        },
      ],

      invalid: [],
    });
  });

  // ==================== Invalid Cases ====================

  describe('invalid cases', () => {
    ruleTester.run('no-direct-fetch', rule, {
      valid: [],
      invalid: [
        // -------------------- Server Files - Direct fetch --------------------
        {
          name: 'server file - direct fetch call',
          code: `"use server";
fetch('https://api.example.com');`,
          errors: [{ messageId: 'forbiddenFetch' }],
        },
        {
          name: 'server file - await fetch call',
          code: `"use server";
const response = await fetch('https://api.example.com/data');`,
          errors: [{ messageId: 'forbiddenFetch' }],
        },
        {
          name: 'server file - fetch with options',
          code: `"use server";
fetch('https://api.example.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});`,
          errors: [{ messageId: 'forbiddenFetch' }],
        },
        {
          name: 'server file - fetch in async function',
          code: `"use server";
async function getData() {
  return await fetch('https://api.example.com');
}`,
          errors: [{ messageId: 'forbiddenFetch' }],
        },
        {
          name: 'server file - fetch in arrow function',
          code: `"use server";
const getData = async () => fetch('https://api.example.com');`,
          errors: [{ messageId: 'forbiddenFetch' }],
        },
        {
          name: 'server file - multiple fetch calls',
          code: `"use server";
fetch('https://api1.example.com');
fetch('https://api2.example.com');`,
          errors: [
            { messageId: 'forbiddenFetch' },
            { messageId: 'forbiddenFetch' },
          ],
        },
        {
          name: 'server file - fetch in try-catch',
          code: `"use server";
try {
  await fetch('https://api.example.com');
} catch (error) {
  console.error(error);
}`,
          errors: [{ messageId: 'forbiddenFetch' }],
        },
        {
          name: 'server file - fetch with template literal URL',
          code: `"use server";
const id = 123;
fetch(\`https://api.example.com/items/\${id}\`);`,
          errors: [{ messageId: 'forbiddenFetch' }],
        },
      ],
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    ruleTester.run('no-direct-fetch', rule, {
      valid: [
        // MVP scope: These are NOT detected (shadowing/aliasing)
        // This is intentional - we only detect direct CallExpression with 'fetch'
        {
          name: 'server file - shadowed fetch (MVP: not detected)',
          code: `"use server";
const f = fetch;
f('https://api.example.com');`,
        },
        {
          name: 'server file - globalThis.fetch (MVP: not detected)',
          code: `"use server";
globalThis.fetch('https://api.example.com');`,
        },
        {
          name: 'server file - window.fetch (MVP: not detected)',
          code: `"use server";
window.fetch('https://api.example.com');`,
        },
      ],
      invalid: [],
    });
  });
});
