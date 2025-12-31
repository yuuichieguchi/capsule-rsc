// Types
export type { SerializablePayload, ServerElement } from './server/payload-types.js';
export type { HydrationResult } from './client/hydrate.js';

// Type guard
export { isSerializablePayload } from './server/payload-types.js';

// Server functions
export { renderToPayload, renderToString } from './server/render-to-payload.js';

// Client functions
export { hydratePayload, hydrateFromString } from './client/hydrate.js';
export { processPayload } from './client/process-payload.js';

// Re-export core types that users might need
export { SerializationError, type Serializable } from '@capsulersc/core';
