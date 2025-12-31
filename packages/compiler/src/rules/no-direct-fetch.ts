/**
 * ESLint rule: no-direct-fetch
 *
 * Forbids direct fetch() calls in server files.
 * Server files should use caps.http.get() or similar alternatives.
 *
 * @example
 * // Bad (in server file)
 * fetch('https://api.example.com');
 *
 * // Good (in server file)
 * caps.http.get('https://api.example.com');
 */

import type { Rule } from 'eslint';
import { isServerFile } from '../utils/rule-context.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct fetch() calls in server files',
      recommended: true,
    },
    messages: {
      forbiddenFetch:
        'Direct fetch() is forbidden in server files. Use caps.http instead.',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    // Only apply to server files
    if (!isServerFile(context)) {
      return {};
    }

    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      CallExpression(node) {
        // Check if callee is identifier 'fetch'
        if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
          // Check if 'fetch' is locally defined (not the global fetch)
          const scope = sourceCode.getScope(node);
          const variable = scope.set.get('fetch');

          // If 'fetch' is defined in this scope or any parent scope (not global),
          // it's a local variable, not the global fetch
          if (variable !== undefined) {
            // Check if any definition is in a non-global scope
            const isLocallyDefined = variable.defs.length > 0;
            if (isLocallyDefined) {
              return; // Skip locally defined fetch
            }
          }

          context.report({ node, messageId: 'forbiddenFetch' });
        }
      },
    };
  },
};

export default rule;
