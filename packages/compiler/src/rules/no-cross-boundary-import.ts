/**
 * ESLint rule: no-cross-boundary-import
 *
 * Enforces server/client boundaries:
 * - Server files ("use server") cannot import from client files
 * - Client files ("use client") cannot import from server files
 * - Shared files (no directive) can import from anywhere
 * - Any file can import from shared files
 * - External packages are always allowed
 *
 * Supports TypeScript path aliases via the `pathAliases` option:
 * @example
 * // eslint.config.js
 * {
 *   rules: {
 *     '@capsulersc/no-cross-boundary-import': ['error', {
 *       pathAliases: {
 *         '@/': './src/',
 *         '~/': './src/'
 *       }
 *     }]
 *   }
 * }
 *
 * @example
 * // Bad (in server file)
 * import { clientFn } from './client-file'; // client file
 * import { clientFn } from '@/components/client'; // path alias to client file
 *
 * // Good (in server file)
 * import { serverFn } from './server-file'; // server file
 * import { sharedFn } from './shared-file'; // shared file
 * import { external } from 'lodash'; // external package
 * import { serverFn } from '@/components/server'; // path alias to server file
 */

import type { Rule } from 'eslint';
import type * as ESTree from 'estree';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseDirective } from '../utils/directive-parser.js';
import { getFileDirective } from '../utils/rule-context.js';

/**
 * Options for the no-cross-boundary-import rule.
 */
interface RuleOptions {
  /**
   * Map of path aliases to their target directories.
   * Keys are the alias prefixes (e.g., '@/', '~/').
   * Values are the relative paths from project root (e.g., './src/').
   */
  pathAliases?: Record<string, string>;
}

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Resolve a path alias to an actual file path.
 * Returns null if the import path doesn't match any configured alias.
 *
 * @param importPath - The import path to resolve (e.g., '@/components/Button')
 * @param pathAliases - Map of alias prefixes to target directories
 * @param projectRoot - The project root directory
 * @returns The resolved relative path (e.g., './src/components/Button') or null
 */
function resolvePathAlias(
  importPath: string,
  pathAliases: Record<string, string>,
  projectRoot: string
): string | null {
  for (const [alias, target] of Object.entries(pathAliases)) {
    if (importPath.startsWith(alias)) {
      const relativePath = importPath.slice(alias.length);
      // Resolve target relative to project root, then append the remaining path
      const resolvedTarget = path.resolve(projectRoot, target);
      return path.join(resolvedTarget, relativePath);
    }
  }
  return null;
}

/**
 * Resolve an import path to an actual file path.
 * Handles extension resolution and index file resolution.
 */
function resolveImportPath(currentDir: string, importPath: string): string | null {
  // Handle explicit extension case (e.g., './server-file.ts')
  const explicitPath = path.resolve(currentDir, importPath);
  if (fs.existsSync(explicitPath) && fs.statSync(explicitPath).isFile()) {
    return explicitPath;
  }

  const basePath = path.resolve(currentDir, importPath);

  // Try with extensions
  for (const ext of EXTENSIONS) {
    const fullPath = basePath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Try index files in directory
  for (const ext of EXTENSIONS) {
    const indexPath = path.join(basePath, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow importing across server/client boundaries',
      recommended: true,
    },
    messages: {
      serverImportClient:
        'Server files cannot import from client files. Import path: {{importPath}}',
      clientImportServer:
        'Client files cannot import from server files. Import path: {{importPath}}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          pathAliases: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const currentDirective = getFileDirective(context);

    // Only apply to files with directives (server or client)
    if (currentDirective === 'none') {
      return {};
    }

    // Extract options
    const options = (context.options[0] ?? {}) as RuleOptions;
    const pathAliases = options.pathAliases ?? {};

    // Get project root: use cwd if available, otherwise derive from filename
    const projectRoot = context.cwd ?? path.dirname(context.filename);

    const currentDir = path.dirname(context.filename);

    /**
     * Check boundary violation for a given import/require path.
     * Reports an error if the import crosses server/client boundaries.
     */
    function checkBoundary(node: Rule.Node, importPath: string): void {
      let resolvedPath: string | null = null;

      // Check if import path matches a configured path alias
      const aliasResolvedPath = resolvePathAlias(importPath, pathAliases, projectRoot);
      if (aliasResolvedPath !== null) {
        // Path alias matched - resolve the actual file
        resolvedPath = resolveImportPath(path.dirname(aliasResolvedPath), path.basename(aliasResolvedPath));
      } else if (importPath.startsWith('.') || importPath.startsWith('/')) {
        // Relative or absolute import
        resolvedPath = resolveImportPath(currentDir, importPath);
      } else {
        // External package (no alias match, not relative/absolute) - skip
        return;
      }

      // Can't resolve the path, skip
      if (resolvedPath === null) {
        return;
      }

      try {
        const importedCode = fs.readFileSync(resolvedPath, 'utf-8');
        const importedDirective = parseDirective(importedCode);

        if (currentDirective === 'server' && importedDirective === 'client') {
          context.report({
            node,
            messageId: 'serverImportClient',
            data: { importPath },
          });
        }

        if (currentDirective === 'client' && importedDirective === 'server') {
          context.report({
            node,
            messageId: 'clientImportServer',
            data: { importPath },
          });
        }
      } catch (error) {
        // Only ignore ENOENT (file not found) - other errors may indicate real problems
        // For MVP, we silently skip all errors to avoid noise in the linting output
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          // Future: consider logging for debugging purposes
          // console.warn(`[capsulersc] Failed to read ${resolvedPath}:`, error);
        }
      }
    }

    /**
     * Extract the module path from a require() call argument.
     * Returns null if the argument is not a static string.
     */
    function extractRequirePath(arg: ESTree.Node): string | null {
      // String literal: require('./module')
      if (arg.type === 'Literal' && typeof arg.value === 'string') {
        return arg.value;
      }
      // Template literal without expressions: require(`./module`)
      if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0 && arg.quasis.length === 1) {
        const quasi = arg.quasis[0];
        if (quasi !== undefined) {
          return quasi.value.cooked ?? quasi.value.raw;
        }
      }
      return null;
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value as string;
        checkBoundary(node, importPath);
      },

      CallExpression(node) {
        // Check if this is a require() call
        const callee = node.callee;
        if (callee.type !== 'Identifier' || callee.name !== 'require') {
          return;
        }

        // Must have exactly one argument
        if (node.arguments.length !== 1) {
          return;
        }

        const arg = node.arguments[0];
        // SpreadElement is not valid for require(), skip if undefined
        if (arg === undefined || arg.type === 'SpreadElement') {
          return;
        }

        const requirePath = extractRequirePath(arg);

        // Skip dynamic require (variable or complex expression)
        if (requirePath === null) {
          return;
        }

        checkBoundary(node as Rule.Node, requirePath);
      },
    };
  },
};

export default rule;
