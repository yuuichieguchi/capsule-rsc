/**
 * ESLint rule: no-process-env
 *
 * Forbids direct process.env access in server files.
 * Environment variables should be injected through configuration.
 *
 * @example
 * // Bad (in server file)
 * const apiKey = process.env.API_KEY;
 *
 * // Good (in server file)
 * import { config } from './config';
 * const apiKey = config.apiKey;
 */

import type { Rule } from 'eslint';
import { isServerFile } from '../utils/rule-context.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct process.env access in server files',
      recommended: true,
    },
    messages: {
      forbiddenProcessEnv:
        'Direct process.env access is forbidden in server files. Use injected config instead.',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    // Only apply to server files
    if (!isServerFile(context)) {
      return {};
    }

    return {
      MemberExpression(node) {
        // Skip optional chaining (process?.env) - MVP: not detected
        if (node.optional) {
          return;
        }

        // Check for process.env pattern
        // This handles: process.env.XXX, process.env['XXX']
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'process' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'env'
        ) {
          context.report({ node, messageId: 'forbiddenProcessEnv' });
        }
      },
    };
  },
};

export default rule;
