/**
 * @capsulersc/compiler ESLint plugin
 *
 * Enforces server/client boundaries and security constraints for CapsuleRSC.
 *
 * Rules:
 * - no-cross-boundary-import: Prevent server/client boundary violations
 * - no-forbidden-server-apis: Forbid eval, new Function, dynamic import in server files
 * - no-direct-fetch: Forbid direct fetch() calls in server files
 * - no-process-env: Forbid direct process.env access in server files
 */

import noCrossBoundaryImport from './rules/no-cross-boundary-import.js';
import noForbiddenServerApis from './rules/no-forbidden-server-apis.js';
import noDirectFetch from './rules/no-direct-fetch.js';
import noProcessEnv from './rules/no-process-env.js';

export const rules = {
  'no-cross-boundary-import': noCrossBoundaryImport,
  'no-forbidden-server-apis': noForbiddenServerApis,
  'no-direct-fetch': noDirectFetch,
  'no-process-env': noProcessEnv,
};

// Utilities for custom rule development
export { parseDirective } from './utils/directive-parser.js';
export type { DirectiveType } from './utils/directive-parser.js';
export { getFileDirective, isServerFile } from './utils/rule-context.js';

export default { rules };
