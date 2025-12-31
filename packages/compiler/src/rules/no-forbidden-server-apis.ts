/**
 * ESLint rule: no-forbidden-server-apis
 *
 * Forbids dangerous APIs in server files:
 * - eval() - arbitrary code execution
 * - new Function() - dynamic function creation
 * - dynamic import() - runtime module loading
 *
 * @example
 * // Bad (in server file)
 * eval('code');
 * new Function('return 1');
 * import('./dynamic');
 *
 * // Good (in server file)
 * JSON.parse('{"key": "value"}');
 * import { helper } from './helper';
 */

import type { Rule } from 'eslint';
import { isServerFile } from '../utils/rule-context.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow dangerous APIs in server files',
      recommended: true,
    },
    messages: {
      forbiddenEval: 'eval() is forbidden in server files.',
      forbiddenFunction: 'new Function() is forbidden in server files.',
      forbiddenDynamicImport:
        'Dynamic import() is forbidden in server files. Use static imports instead.',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    // Only apply to server files
    if (!isServerFile(context)) {
      return {};
    }

    return {
      CallExpression(node) {
        // Check for direct eval()
        if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
          context.report({ node, messageId: 'forbiddenEval' });
          return;
        }

        // Check for indirect eval: window.eval, globalThis.eval, global.eval
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          ['window', 'globalThis', 'global'].includes(node.callee.object.name) &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'eval'
        ) {
          context.report({ node, messageId: 'forbiddenEval' });
        }
      },
      NewExpression(node) {
        // Check for new Function()
        if (node.callee.type === 'Identifier' && node.callee.name === 'Function') {
          context.report({ node, messageId: 'forbiddenFunction' });
        }
      },
      ImportExpression(node) {
        // Dynamic import()
        context.report({ node, messageId: 'forbiddenDynamicImport' });
      },
    };
  },
};

export default rule;
