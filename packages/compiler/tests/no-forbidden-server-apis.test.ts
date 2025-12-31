/**
 * Test suite for no-forbidden-server-apis rule
 *
 * This rule forbids dangerous APIs in server files:
 * - eval() - arbitrary code execution
 * - new Function() - dynamic function creation
 * - dynamic import() - runtime module loading
 *
 * Coverage:
 * - Happy path: client/shared files can use these APIs
 * - Server files must NOT use these APIs
 * - Safe alternatives are allowed
 */

import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../src/rules/no-forbidden-server-apis.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('no-forbidden-server-apis', () => {
  // ==================== Valid Cases ====================

  describe('valid cases', () => {
    ruleTester.run('no-forbidden-server-apis', rule, {
      valid: [
        // -------------------- Client Files --------------------
        {
          name: 'client file - eval allowed',
          code: `"use client";
eval('console.log("hello")');`,
        },
        {
          name: 'client file - new Function allowed',
          code: `"use client";
const fn = new Function('a', 'b', 'return a + b');`,
        },
        {
          name: 'client file - dynamic import allowed',
          code: `"use client";
const module = await import('./dynamic-module');`,
        },

        // -------------------- Shared Files (no directive) --------------------
        {
          name: 'shared file - eval allowed',
          code: `// Shared file
eval('1 + 1');`,
        },
        {
          name: 'shared file - new Function allowed',
          code: `const compute = new Function('x', 'return x * 2');`,
        },
        {
          name: 'shared file - dynamic import allowed',
          code: `async function loadModule(name) {
  return await import(\`./modules/\${name}\`);
}`,
        },

        // -------------------- Server Files - Safe Alternatives --------------------
        {
          name: 'server file - JSON.parse allowed',
          code: `"use server";
const data = JSON.parse('{"key": "value"}');`,
        },
        {
          name: 'server file - static import allowed',
          code: `"use server";
import { helper } from './helper';`,
        },
        {
          name: 'server file - regular function call allowed',
          code: `"use server";
function compute(x) {
  return x * 2;
}
compute(5);`,
        },
        {
          name: 'server file - no dangerous APIs',
          code: `"use server";
const result = Math.random();`,
        },
        {
          name: 'server file - method named eval on object (not global)',
          code: `"use server";
const parser = {
  eval: (expr) => expr.length,
};
parser.eval('test');`,
        },
        {
          name: 'server file - Function reference (not new call)',
          code: `"use server";
const FunctionRef = Function;
console.log(typeof FunctionRef);`,
        },
      ],

      invalid: [],
    });
  });

  // ==================== Invalid Cases - eval() ====================

  describe('invalid cases - eval()', () => {
    ruleTester.run('no-forbidden-server-apis', rule, {
      valid: [],
      invalid: [
        {
          name: 'server file - direct eval call',
          code: `"use server";
eval('console.log("dangerous")');`,
          errors: [{ messageId: 'forbiddenEval' }],
        },
        {
          name: 'server file - eval with variable',
          code: `"use server";
const code = 'return 1 + 1';
eval(code);`,
          errors: [{ messageId: 'forbiddenEval' }],
        },
        {
          name: 'server file - eval in function',
          code: `"use server";
function execute(code) {
  return eval(code);
}`,
          errors: [{ messageId: 'forbiddenEval' }],
        },
        {
          name: 'server file - eval in conditional',
          code: `"use server";
if (condition) {
  eval('code');
}`,
          errors: [{ messageId: 'forbiddenEval' }],
        },
      ],
    });
  });

  // ==================== Invalid Cases - indirect eval() ====================

  describe('invalid cases - indirect eval()', () => {
    ruleTester.run('no-forbidden-server-apis', rule, {
      valid: [],
      invalid: [
        {
          name: 'server file - window.eval',
          code: `"use server";
window.eval('console.log("dangerous")');`,
          errors: [{ messageId: 'forbiddenEval' }],
        },
        {
          name: 'server file - globalThis.eval',
          code: `"use server";
globalThis.eval('console.log("dangerous")');`,
          errors: [{ messageId: 'forbiddenEval' }],
        },
        {
          name: 'server file - global.eval',
          code: `"use server";
global.eval('console.log("dangerous")');`,
          errors: [{ messageId: 'forbiddenEval' }],
        },
      ],
    });
  });

  // ==================== Invalid Cases - new Function() ====================

  describe('invalid cases - new Function()', () => {
    ruleTester.run('no-forbidden-server-apis', rule, {
      valid: [],
      invalid: [
        {
          name: 'server file - new Function basic',
          code: `"use server";
const fn = new Function('return 1');`,
          errors: [{ messageId: 'forbiddenFunction' }],
        },
        {
          name: 'server file - new Function with params',
          code: `"use server";
const add = new Function('a', 'b', 'return a + b');`,
          errors: [{ messageId: 'forbiddenFunction' }],
        },
        {
          name: 'server file - new Function invoked',
          code: `"use server";
const result = new Function('return 42')();`,
          errors: [{ messageId: 'forbiddenFunction' }],
        },
        {
          name: 'server file - new Function in expression',
          code: `"use server";
const fns = [new Function('return 1'), new Function('return 2')];`,
          errors: [
            { messageId: 'forbiddenFunction' },
            { messageId: 'forbiddenFunction' },
          ],
        },
      ],
    });
  });

  // ==================== Invalid Cases - dynamic import() ====================

  describe('invalid cases - dynamic import()', () => {
    ruleTester.run('no-forbidden-server-apis', rule, {
      valid: [],
      invalid: [
        {
          name: 'server file - dynamic import with literal',
          code: `"use server";
const module = await import('./dynamic-module');`,
          errors: [{ messageId: 'forbiddenDynamicImport' }],
        },
        {
          name: 'server file - dynamic import with variable',
          code: `"use server";
const moduleName = './module';
const mod = await import(moduleName);`,
          errors: [{ messageId: 'forbiddenDynamicImport' }],
        },
        {
          name: 'server file - dynamic import with template literal',
          code: `"use server";
const name = 'helper';
const mod = await import(\`./modules/\${name}\`);`,
          errors: [{ messageId: 'forbiddenDynamicImport' }],
        },
        {
          name: 'server file - dynamic import in function',
          code: `"use server";
async function loadPlugin(name) {
  return await import(\`./plugins/\${name}\`);
}`,
          errors: [{ messageId: 'forbiddenDynamicImport' }],
        },
        {
          name: 'server file - dynamic import then syntax',
          code: `"use server";
import('./lazy').then(m => m.default());`,
          errors: [{ messageId: 'forbiddenDynamicImport' }],
        },
      ],
    });
  });

  // ==================== Mixed Invalid Cases ====================

  describe('mixed invalid cases', () => {
    ruleTester.run('no-forbidden-server-apis', rule, {
      valid: [],
      invalid: [
        {
          name: 'server file - multiple violations',
          code: `"use server";
eval('code');
const fn = new Function('return 1');
const mod = await import('./dynamic');`,
          errors: [
            { messageId: 'forbiddenEval' },
            { messageId: 'forbiddenFunction' },
            { messageId: 'forbiddenDynamicImport' },
          ],
        },
      ],
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    ruleTester.run('no-forbidden-server-apis', rule, {
      valid: [
        // Things that look like violations but aren't
        {
          name: 'server file - string containing "eval"',
          code: `"use server";
const text = "do not use eval in production";`,
        },
        {
          name: 'server file - comment containing eval',
          code: `"use server";
// Don't use eval()
const x = 1;`,
        },
        {
          name: 'server file - Function as identifier (not new)',
          code: `"use server";
const Fn = Function;`,
        },
      ],
      invalid: [],
    });
  });
});
