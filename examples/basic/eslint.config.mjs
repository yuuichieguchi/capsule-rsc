import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import capsulersc from '@capsulersc/compiler';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@capsulersc': capsulersc,
    },
    rules: {
      // Enable all CapsuleRSC rules
      '@capsulersc/no-cross-boundary-import': 'error',
      '@capsulersc/no-forbidden-server-apis': 'error',
      '@capsulersc/no-direct-fetch': 'error',
      '@capsulersc/no-process-env': 'error',
    },
  }
);
