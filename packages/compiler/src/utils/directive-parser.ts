/**
 * Utility for parsing "use server" / "use client" directives at the top of files.
 */

export type DirectiveType = 'server' | 'client' | 'none';

/**
 * Parse the directive at the top of a file.
 * Returns 'server' for "use server", 'client' for "use client", or 'none' otherwise.
 *
 * The directive must be a string literal expression statement at the start of the file
 * (after any leading comments and empty lines).
 */
export function parseDirective(code: string): DirectiveType {
  const lines = code.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      continue;
    }

    // Skip comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Regex patterns for directives:
    // - Matches single or double quotes
    // - Optional semicolon
    // - Optional trailing comment
    const USE_SERVER_REGEX = /^["']use server["'];?\s*(\/\/.*)?$/;
    const USE_CLIENT_REGEX = /^["']use client["'];?\s*(\/\/.*)?$/;

    // Check for "use server" directive
    if (USE_SERVER_REGEX.test(trimmed)) {
      return 'server';
    }

    // Check for "use client" directive
    if (USE_CLIENT_REGEX.test(trimmed)) {
      return 'client';
    }

    // First non-comment, non-empty line is not a directive
    return 'none';
  }

  return 'none';
}
