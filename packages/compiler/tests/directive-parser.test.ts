/**
 * Test suite for directive-parser utility
 *
 * Tests the parseDirective function that detects "use server" / "use client" directives.
 *
 * Coverage:
 * - Happy path: Standard directive formats with semicolon
 * - Edge cases: Missing semicolons, trailing comments
 * - Error handling: No directive, invalid formats
 */

import { describe, it, expect } from 'vitest';
import { parseDirective } from '../src/utils/directive-parser.js';

describe('parseDirective', () => {
  // ==================== Happy Path (Currently Working) ====================

  describe('standard directive formats (with semicolon)', () => {
    it('should return "server" for "use server"; with double quotes', () => {
      const code = '"use server";';
      expect(parseDirective(code)).toBe('server');
    });

    it("should return 'server' for 'use server'; with single quotes", () => {
      const code = "'use server';";
      expect(parseDirective(code)).toBe('server');
    });

    it('should return "client" for "use client"; with double quotes', () => {
      const code = '"use client";';
      expect(parseDirective(code)).toBe('client');
    });

    it("should return 'client' for 'use client'; with single quotes", () => {
      const code = "'use client';";
      expect(parseDirective(code)).toBe('client');
    });

    it('should return "none" for files without directives', () => {
      const code = 'const x = 1;';
      expect(parseDirective(code)).toBe('none');
    });

    it('should return "none" for empty files', () => {
      const code = '';
      expect(parseDirective(code)).toBe('none');
    });

    it('should skip leading comments and find directive', () => {
      const code = `// This is a comment
"use server";`;
      expect(parseDirective(code)).toBe('server');
    });

    it('should skip leading empty lines and find directive', () => {
      const code = `

"use server";`;
      expect(parseDirective(code)).toBe('server');
    });
  });

  // ==================== Failing Tests: No Semicolon ====================

  describe('directive without semicolon (TDD Red phase)', () => {
    it('should return "server" for "use server" without semicolon (double quotes)', () => {
      // Valid JavaScript: "use server" without trailing semicolon
      const code = '"use server"';
      expect(parseDirective(code)).toBe('server');
    });

    it("should return 'server' for 'use server' without semicolon (single quotes)", () => {
      // Valid JavaScript: 'use server' without trailing semicolon
      const code = "'use server'";
      expect(parseDirective(code)).toBe('server');
    });

    it('should return "client" for "use client" without semicolon (double quotes)', () => {
      // Valid JavaScript: "use client" without trailing semicolon
      const code = '"use client"';
      expect(parseDirective(code)).toBe('client');
    });

    it("should return 'client' for 'use client' without semicolon (single quotes)", () => {
      // Valid JavaScript: 'use client' without trailing semicolon
      const code = "'use client'";
      expect(parseDirective(code)).toBe('client');
    });
  });

  // ==================== Failing Tests: Trailing Comments ====================

  describe('directive with trailing comment (TDD Red phase)', () => {
    it('should return "server" for "use server"; with trailing comment', () => {
      // Valid JavaScript: directive followed by comment on same line
      const code = '"use server"; // server file';
      expect(parseDirective(code)).toBe('server');
    });

    it("should return 'server' for 'use server'; with trailing comment", () => {
      // Valid JavaScript: directive followed by comment on same line
      const code = "'use server'; // server file";
      expect(parseDirective(code)).toBe('server');
    });

    it('should return "client" for "use client"; with trailing comment', () => {
      // Valid JavaScript: directive followed by comment on same line
      const code = '"use client"; // client file';
      expect(parseDirective(code)).toBe('client');
    });

    it("should return 'client' for 'use client'; with trailing comment", () => {
      // Valid JavaScript: directive followed by comment on same line
      const code = "'use client'; // client file";
      expect(parseDirective(code)).toBe('client');
    });
  });

  // ==================== Failing Tests: Combined (No Semicolon + Comment) ====================

  describe('directive without semicolon and with trailing comment (TDD Red phase)', () => {
    it('should return "server" for "use server" without semicolon but with comment', () => {
      // Valid JavaScript: directive without semicolon, followed by comment
      const code = '"use server" // server file';
      expect(parseDirective(code)).toBe('server');
    });

    it('should return "client" for "use client" without semicolon but with comment', () => {
      // Valid JavaScript: directive without semicolon, followed by comment
      const code = '"use client" // client file';
      expect(parseDirective(code)).toBe('client');
    });
  });

  // ==================== Edge Cases (should NOT be detected) ====================

  describe('invalid directive formats (should return "none")', () => {
    it('should return "none" for directive not at top level', () => {
      const code = `const x = 1;
"use server";`;
      expect(parseDirective(code)).toBe('none');
    });

    it('should return "none" for use strict directive', () => {
      const code = '"use strict";';
      expect(parseDirective(code)).toBe('none');
    });

    it('should return "none" for invalid directive string', () => {
      const code = '"use serverr";';
      expect(parseDirective(code)).toBe('none');
    });

    it('should return "none" for directive with backticks', () => {
      const code = '`use server`;';
      expect(parseDirective(code)).toBe('none');
    });
  });
});
