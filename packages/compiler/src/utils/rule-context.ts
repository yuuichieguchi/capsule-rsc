/**
 * Utility functions for ESLint rule context.
 * Provides common helpers for directive detection in rule implementations.
 */

import type { Rule } from 'eslint';
import { parseDirective, type DirectiveType } from './directive-parser.js';

/**
 * Get the file directive from ESLint rule context.
 * Handles both old and new ESLint API for sourceCode access.
 */
export function getFileDirective(context: Rule.RuleContext): DirectiveType {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  return parseDirective(sourceCode.getText());
}

/**
 * Check if the current file is a server file ("use server" directive).
 */
export function isServerFile(context: Rule.RuleContext): boolean {
  return getFileDirective(context) === 'server';
}

export type { DirectiveType };
