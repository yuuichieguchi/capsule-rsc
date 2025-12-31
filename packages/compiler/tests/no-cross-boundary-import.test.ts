/**
 * Test suite for no-cross-boundary-import rule
 *
 * This is the most complex rule. It enforces server/client boundaries:
 * - Server files ("use server") cannot import from client files ("use client")
 * - Client files ("use client") cannot import from server files ("use server")
 * - Shared files (no directive) can import from anywhere
 * - Any file can import from shared files
 * - External packages are always allowed
 *
 * Coverage:
 * - Valid imports within boundaries
 * - Invalid cross-boundary imports
 * - External package imports
 * - Index file resolution
 * - Extension resolution (.ts, .tsx, .js, .jsx)
 */

import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { RuleTester } from 'eslint';
import * as path from 'node:path';
import * as fs from 'node:fs';
import rule from '../src/rules/no-cross-boundary-import.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

// Fixture paths for testing
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('no-cross-boundary-import', () => {
  // ==================== Valid Cases - Same Boundary ====================

  describe('valid cases - same boundary imports', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // -------------------- Server to Server --------------------
        {
          name: 'server file importing server file',
          code: `"use server";
import { serverFunction } from './server-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'server file importing multiple from server file',
          code: `"use server";
import { serverValue, serverFunction } from './server-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },

        // -------------------- Client to Client --------------------
        {
          name: 'client file importing client file',
          code: `"use client";
import { clientFunction } from './client-file';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
        },
        // Note: `import type` is TypeScript syntax requiring TS parser
        // For MVP, we test regular imports only
        {
          name: 'client file importing aliased from client file',
          code: `"use client";
import { clientFunction as cf } from './client-file';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
        },
      ],

      invalid: [],
    });
  });

  // ==================== Valid Cases - Shared File Imports ====================

  describe('valid cases - shared file imports', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // -------------------- Any file importing from shared --------------------
        {
          name: 'server file importing from shared file',
          code: `"use server";
import { sharedFunction } from './shared-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'client file importing from shared file',
          code: `"use client";
import { sharedValue } from './shared-file';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
        },

        // -------------------- Shared file importing anything --------------------
        {
          name: 'shared file importing from server file',
          code: `// No directive
import { serverFunction } from './server-file';`,
          filename: path.join(FIXTURES_DIR, 'test-shared.ts'),
        },
        {
          name: 'shared file importing from client file',
          code: `// No directive
import { clientFunction } from './client-file';`,
          filename: path.join(FIXTURES_DIR, 'test-shared.ts'),
        },
        {
          name: 'shared file importing from shared file',
          code: `import { sharedValue } from './shared-file';`,
          filename: path.join(FIXTURES_DIR, 'test-shared.ts'),
        },
      ],

      invalid: [],
    });
  });

  // ==================== Valid Cases - External Packages ====================

  describe('valid cases - external package imports', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // -------------------- External packages always allowed --------------------
        {
          name: 'server file importing react',
          code: `"use server";
import React from 'react';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'server file importing lodash',
          code: `"use server";
import _ from 'lodash';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'client file importing react',
          code: `"use client";
import { useState } from 'react';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
        },
        {
          name: 'server file importing scoped package',
          code: `"use server";
import { something } from '@capsulersc/core';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'server file importing node builtin',
          code: `"use server";
import * as fs from 'node:fs';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
      ],

      invalid: [],
    });
  });

  // ==================== Valid Cases - Index Resolution ====================

  describe('valid cases - index file resolution', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // Server importing from directory with index.ts (server)
        {
          name: 'server file importing from index directory',
          code: `"use server";
import { indexValue } from './index-dir';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
      ],

      invalid: [],
    });
  });

  // ==================== Invalid Cases - Server importing Client ====================

  describe('invalid cases - server importing client', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [],
      invalid: [
        {
          name: 'server file importing client file - default import',
          code: `"use server";
import clientModule from './client-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'server file importing client file - named import',
          code: `"use server";
import { clientFunction } from './client-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'server file importing client file - namespace import',
          code: `"use server";
import * as client from './client-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'server file importing client file - side effect import',
          code: `"use server";
import './client-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'server file importing multiple client files',
          code: `"use server";
import { clientFunction } from './client-file';
import { otherClient } from './another-client';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [
            { messageId: 'serverImportClient' },
            { messageId: 'serverImportClient' },
          ],
        },
      ],
    });
  });

  // ==================== Invalid Cases - Client importing Server ====================

  describe('invalid cases - client importing server', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [],
      invalid: [
        {
          name: 'client file importing server file - default import',
          code: `"use client";
import serverModule from './server-file';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          errors: [{ messageId: 'clientImportServer' }],
        },
        {
          name: 'client file importing server file - named import',
          code: `"use client";
import { serverFunction } from './server-file';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          errors: [{ messageId: 'clientImportServer' }],
        },
        {
          name: 'client file importing server file - namespace import',
          code: `"use client";
import * as server from './server-file';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          errors: [{ messageId: 'clientImportServer' }],
        },
        {
          name: 'client file importing server file - with extension',
          code: `"use client";
import { serverFunction } from './server-file.ts';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          errors: [{ messageId: 'clientImportServer' }],
        },
        {
          name: 'client file importing server file - parent directory',
          code: `"use client";
import { serverFunction } from '../server-file';`,
          filename: path.join(FIXTURES_DIR, 'subdir', 'test-client.ts'),
          errors: [{ messageId: 'clientImportServer' }],
        },
      ],
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // Type-only imports might be allowed in future versions
        // For MVP, we treat all imports the same
        {
          name: 'import without specifier (bare import)',
          code: `"use server";
import 'side-effect-module';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'dynamic import (not static - MVP: not detected)',
          code: `"use server";
const path = './client-file';
const mod = await import(path);`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
      ],
      invalid: [],
    });
  });

  // ==================== CommonJS require() Detection ====================

  describe('CommonJS require() - valid cases', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // -------------------- Same boundary with require --------------------
        {
          name: 'server file requiring server file',
          code: `"use server";
const serverModule = require('./server-file');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'client file requiring client file',
          code: `"use client";
const clientModule = require('./client-file');`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
        },

        // -------------------- Shared file imports --------------------
        {
          name: 'server file requiring shared file',
          code: `"use server";
const sharedModule = require('./shared-file');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'shared file requiring anything (no directive)',
          code: `const clientModule = require('./client-file');`,
          filename: path.join(FIXTURES_DIR, 'test-shared.ts'),
        },

        // -------------------- External packages --------------------
        {
          name: 'server file requiring external package',
          code: `"use server";
const lodash = require('lodash');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'server file requiring scoped package',
          code: `"use server";
const core = require('@capsulersc/core');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
        {
          name: 'server file requiring node builtin',
          code: `"use server";
const fs = require('node:fs');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },

        // -------------------- Non-string arguments (not detected) --------------------
        {
          name: 'dynamic require with variable (MVP: not detected)',
          code: `"use server";
const path = './client-file';
const mod = require(path);`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
      ],
      invalid: [],
    });
  });

  describe('CommonJS require() - invalid cases', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [],
      invalid: [
        // -------------------- Server requiring Client --------------------
        {
          name: 'server file requiring client file',
          code: `"use server";
const clientModule = require('./client-file');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'server file requiring client file with destructuring',
          code: `"use server";
const { clientFunction } = require('./client-file');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'server file requiring multiple client files',
          code: `"use server";
const client1 = require('./client-file');
const client2 = require('./another-client');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [
            { messageId: 'serverImportClient' },
            { messageId: 'serverImportClient' },
          ],
        },

        // -------------------- Client requiring Server --------------------
        {
          name: 'client file requiring server file',
          code: `"use client";
const serverModule = require('./server-file');`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          errors: [{ messageId: 'clientImportServer' }],
        },
        {
          name: 'client file requiring server file with explicit extension',
          code: `"use client";
const serverModule = require('./server-file.ts');`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          errors: [{ messageId: 'clientImportServer' }],
        },
      ],
    });
  });

  describe('CommonJS require() - with path aliases', () => {
    const srcDir = path.join(FIXTURES_DIR, 'src') + '/';
    const pathAliasOptions = {
      pathAliases: {
        '@/': srcDir,
      },
    };

    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        {
          name: 'server file requiring server component via @/ alias',
          code: `"use server";
const serverComponent = require('@/components/server-component');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          options: [pathAliasOptions],
        },
      ],
      invalid: [
        {
          name: 'server file requiring client component via @/ alias',
          code: `"use server";
const clientComponent = require('@/components/client-component');`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          options: [pathAliasOptions],
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'client file requiring server component via @/ alias',
          code: `"use client";
const serverComponent = require('@/components/server-component');`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          options: [pathAliasOptions],
          errors: [{ messageId: 'clientImportServer' }],
        },
      ],
    });
  });

  describe('CommonJS require() - template literals', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        {
          name: 'require with template literal - server to server',
          code: `"use server";
const serverModule = require(\`./server-file\`);`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
      ],
      invalid: [
        {
          name: 'require with template literal - server to client',
          code: `"use server";
const clientModule = require(\`./client-file\`);`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
      ],
    });
  });

  // ==================== Extension Resolution ====================

  describe('extension resolution', () => {
    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // Test that extensions are resolved correctly
        {
          name: 'import without extension resolves to .ts',
          code: `"use server";
import { serverFunction } from './server-file';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
        },
      ],
      invalid: [
        // Invalid even with explicit extension
        {
          name: 'server importing client with .ts extension',
          code: `"use server";
import { clientFunction } from './client-file.ts';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          errors: [{ messageId: 'serverImportClient' }],
        },
      ],
    });
  });

  // ==================== Path Aliases ====================

  describe('path aliases - valid cases', () => {
    // Use absolute paths to ensure tests work regardless of cwd
    const srcDir = path.join(FIXTURES_DIR, 'src') + '/';
    const pathAliasOptions = {
      pathAliases: {
        '@/': srcDir,
        '~/': srcDir,
      },
    };

    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [
        // -------------------- Same boundary with path alias --------------------
        {
          name: 'server file importing server component via @/ alias',
          code: `"use server";
import { serverComponent } from '@/components/server-component';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          options: [pathAliasOptions],
        },
        {
          name: 'client file importing client component via @/ alias',
          code: `"use client";
import { clientComponent } from '@/components/client-component';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          options: [pathAliasOptions],
        },
        {
          name: 'client file importing client component via ~/ alias',
          code: `"use client";
import { clientComponent } from '~/components/client-component';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          options: [pathAliasOptions],
        },

        // -------------------- Shared file imports with path alias --------------------
        {
          name: 'server file importing shared util via @/ alias',
          code: `"use server";
import { sharedUtil } from '@/utils/shared-util';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          options: [pathAliasOptions],
        },
        {
          name: 'client file importing shared util via @/ alias',
          code: `"use client";
import { sharedUtil } from '@/utils/shared-util';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          options: [pathAliasOptions],
        },

        // -------------------- Unconfigured alias (should be skipped) --------------------
        {
          name: 'unconfigured alias is treated as external package',
          code: `"use server";
import { something } from '#/some-module';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          options: [pathAliasOptions],
        },

        // -------------------- No pathAliases option (backward compatibility) --------------------
        {
          name: 'path alias without option is treated as external package',
          code: `"use server";
import { something } from '@/components/client-component';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          // No options - should be skipped as external package
        },
      ],
      invalid: [],
    });
  });

  describe('path aliases - invalid cases', () => {
    // Use absolute paths to ensure tests work regardless of cwd
    const srcDir = path.join(FIXTURES_DIR, 'src') + '/';
    const pathAliasOptions = {
      pathAliases: {
        '@/': srcDir,
        '~/': srcDir,
      },
    };

    ruleTester.run('no-cross-boundary-import', rule, {
      valid: [],
      invalid: [
        // -------------------- Server importing Client via alias --------------------
        {
          name: 'server file importing client component via @/ alias',
          code: `"use server";
import { clientComponent } from '@/components/client-component';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          options: [pathAliasOptions],
          errors: [{ messageId: 'serverImportClient' }],
        },
        {
          name: 'server file importing client component via ~/ alias',
          code: `"use server";
import { clientComponent } from '~/components/client-component';`,
          filename: path.join(FIXTURES_DIR, 'test-server.ts'),
          options: [pathAliasOptions],
          errors: [{ messageId: 'serverImportClient' }],
        },

        // -------------------- Client importing Server via alias --------------------
        {
          name: 'client file importing server component via @/ alias',
          code: `"use client";
import { serverComponent } from '@/components/server-component';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          options: [pathAliasOptions],
          errors: [{ messageId: 'clientImportServer' }],
        },
        {
          name: 'client file importing server component via ~/ alias',
          code: `"use client";
import { serverComponent } from '~/components/server-component';`,
          filename: path.join(FIXTURES_DIR, 'test-client.ts'),
          options: [pathAliasOptions],
          errors: [{ messageId: 'clientImportServer' }],
        },
      ],
    });
  });
});
