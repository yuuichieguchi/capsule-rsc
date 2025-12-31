/**
 * Test suite for no-process-env rule
 *
 * This rule forbids direct process.env access in server files.
 * Environment variables should be injected through configuration.
 *
 * Coverage:
 * - Happy path: client/shared files can use process.env
 * - Server files must NOT access process.env directly
 * - Safe alternatives like injected config are allowed
 */

import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../src/rules/no-process-env.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('no-process-env', () => {
  // ==================== Valid Cases ====================

  describe('valid cases', () => {
    ruleTester.run('no-process-env', rule, {
      valid: [
        // -------------------- Client Files --------------------
        {
          name: 'client file - process.env.API_KEY allowed',
          code: `"use client";
const apiKey = process.env.API_KEY;`,
        },
        {
          name: 'client file - process.env bracket notation allowed',
          code: `"use client";
const key = process.env['SECRET_KEY'];`,
        },
        {
          name: 'client file - process.env.NODE_ENV allowed',
          code: `"use client";
if (process.env.NODE_ENV === 'production') {
  console.log('prod');
}`,
        },

        // -------------------- Shared Files (no directive) --------------------
        {
          name: 'shared file - process.env allowed',
          code: `// Shared file
const env = process.env.NODE_ENV;`,
        },
        {
          name: 'shared file - multiple process.env access allowed',
          code: `const config = {
  apiUrl: process.env.API_URL,
  debug: process.env.DEBUG === 'true',
};`,
        },

        // -------------------- Server Files - Safe Alternatives --------------------
        {
          name: 'server file - injected config allowed',
          code: `"use server";
import { config } from './config';
const apiKey = config.apiKey;`,
        },
        {
          name: 'server file - getConfig function allowed',
          code: `"use server";
import { getConfig } from '@capsulersc/core';
const { apiKey } = getConfig();`,
        },
        {
          name: 'server file - no process.env usage',
          code: `"use server";
const data = { key: 'hardcoded' };`,
        },
        {
          name: 'server file - process (without .env) allowed',
          code: `"use server";
console.log(process.cwd());
console.log(process.pid);`,
        },
        {
          name: 'server file - variable named env',
          code: `"use server";
const env = { API_KEY: 'test' };
console.log(env.API_KEY);`,
        },
      ],

      invalid: [],
    });
  });

  // ==================== Invalid Cases ====================

  describe('invalid cases', () => {
    ruleTester.run('no-process-env', rule, {
      valid: [],
      invalid: [
        // -------------------- Server Files - Direct process.env --------------------
        {
          name: 'server file - process.env.API_KEY',
          code: `"use server";
const apiKey = process.env.API_KEY;`,
          errors: [{ messageId: 'forbiddenProcessEnv' }],
        },
        {
          name: 'server file - process.env bracket notation',
          code: `"use server";
const key = process.env['SECRET_KEY'];`,
          errors: [{ messageId: 'forbiddenProcessEnv' }],
        },
        {
          name: 'server file - process.env.NODE_ENV',
          code: `"use server";
if (process.env.NODE_ENV === 'production') {
  console.log('prod');
}`,
          errors: [{ messageId: 'forbiddenProcessEnv' }],
        },
        {
          name: 'server file - multiple process.env access',
          code: `"use server";
const config = {
  apiUrl: process.env.API_URL,
  debug: process.env.DEBUG === 'true',
};`,
          errors: [
            { messageId: 'forbiddenProcessEnv' },
            { messageId: 'forbiddenProcessEnv' },
          ],
        },
        {
          name: 'server file - process.env in template literal',
          code: `"use server";
const url = \`https://\${process.env.API_HOST}/api\`;`,
          errors: [{ messageId: 'forbiddenProcessEnv' }],
        },
        {
          name: 'server file - process.env in function',
          code: `"use server";
function getApiUrl() {
  return process.env.API_URL;
}`,
          errors: [{ messageId: 'forbiddenProcessEnv' }],
        },
        {
          name: 'server file - process.env with default value',
          code: `"use server";
const port = process.env.PORT || 3000;`,
          errors: [{ messageId: 'forbiddenProcessEnv' }],
        },
        {
          name: 'server file - process.env in conditional',
          code: `"use server";
const isDebug = process.env.DEBUG === 'true';`,
          errors: [{ messageId: 'forbiddenProcessEnv' }],
        },
      ],
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    ruleTester.run('no-process-env', rule, {
      valid: [
        // MVP scope: These are NOT detected
        // This is intentional - we only detect MemberExpression process.env
        {
          name: 'server file - optional chaining (MVP: not detected)',
          code: `"use server";
const env = process?.env;`,
        },
        {
          name: 'server file - destructuring (MVP: not detected)',
          code: `"use server";
const { env } = process;
console.log(env.API_KEY);`,
        },
        {
          name: 'server file - aliased process (MVP: not detected)',
          code: `"use server";
const p = process;
console.log(p.env.API_KEY);`,
        },
      ],
      invalid: [],
    });
  });
});
