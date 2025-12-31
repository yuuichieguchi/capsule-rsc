# CapsuleRSC

Safe Server/Client Boundary Enforcement for React Server Components

## Overview

CapsuleRSC is a minimal framework that enforces **safe server/client boundaries** with strong guarantees. It provides three layers of defense:

1. **Type-level** - TypeScript types prevent non-serializable data at compile time
2. **Build-time** - ESLint plugin catches boundary violations during development
3. **Runtime** - `assertSerializable` provides the last line of defense

## Why Boundaries Matter

React Server Components (RSC) introduce a new challenge: data must cross from server to client in a safe, serializable format. Without proper boundaries:

- Functions passed to client components cause runtime errors
- Date objects become strings unexpectedly
- Class instances lose their methods
- Circular references crash serialization

CapsuleRSC prevents these issues by enforcing boundaries at every layer.

## FAQ

### How is this different from Next.js Server Actions?

Next.js Server Actions let you call server functions from the client, but they don't enforce boundary safety. You can accidentally return a `Date` object and it silently becomes a string. You can pass a function and get a runtime error.

CapsuleRSC provides **3-layer defense**:
- **Type-level**: `Serializable` type prevents non-serializable data at compile time
- **Build-time**: ESLint rules catch violations before you run the code
- **Runtime**: `assertSerializable` fails fast with clear error messages

### How is this different from tRPC?

tRPC focuses on **type-safe API calls** between client and server. It's excellent for that purpose.

CapsuleRSC focuses on **RSC boundary serialization safety**. It ensures that data crossing the server/client boundary is always serializable.

They solve different problems and can be used together.

### Isn't HttpCapability just a fetch wrapper?

Yes, but that's the point. **Capability Injection** is a form of Dependency Injection:

1. **Testability**: Mock `HttpCapability` in tests without mocking global `fetch`
2. **Explicitness**: All side effects are visible in the function signature
3. **Enforcement**: ESLint forbids direct `fetch()` in server files, forcing you to use capabilities

```typescript
// ❌ Forbidden in server files (ESLint error)
const res = await fetch('https://api.example.com/data');

// ✅ Allowed: explicit capability usage
const http = new HttpCapability({ allowedHosts: ['api.example.com'] });
const res = await http.get('https://api.example.com/data');
```

## Packages

| Package | Description |
|---------|-------------|
| `@capsulersc/core` | Core types, `assertSerializable`, and capabilities |
| `@capsulersc/compiler` | ESLint plugin for boundary enforcement |
| `@capsulersc/runtime` | Serializable payload processing |

## Installation

```bash
npm install @capsulersc/core @capsulersc/compiler @capsulersc/runtime
```

### ESLint Setup

```javascript
// eslint.config.mjs
import capsulersc from '@capsulersc/compiler';

export default [
  ...capsulersc.configs.recommended,
  // your other configs
];
```

## Core Concepts

### Serializable Type

Only these values can cross the server/client boundary:

```typescript
type Serializable =
  | null
  | boolean
  | number        // finite only (no NaN, Infinity)
  | string
  | Serializable[]
  | { [key: string]: Serializable };
```

### assertSerializable

Runtime validation with clear error messages:

```typescript
import { assertSerializable } from '@capsulersc/core';

const data = { user: { createdAt: new Date() } };
assertSerializable(data);
// SerializationError: Non-plain object (Date) is not serializable at path "$.user.createdAt"
```

### ESLint Rules

The `@capsulersc/compiler` package provides these rules:

| Rule | Description |
|------|-------------|
| `no-cross-boundary-import` | Server files cannot import client files and vice versa |
| `no-forbidden-server-apis` | Forbids `eval`, `new Function`, `import()` in server files |
| `no-direct-fetch` | Forbids direct `fetch()` in server files |
| `no-process-env` | Forbids direct `process.env` access in server files |

### File Directives

```typescript
"use server";  // Server-only file
"use client";  // Client-only file
// No directive = shared file
```

## Example Usage

### Server Action

```typescript
"use server";

import { registerAction, invokeAction, LogCapability } from '@capsulersc/core';

const log = new LogCapability();

async function getGreeting(input: unknown) {
  const { name } = input as { name: string };
  log.info('Processing request', { name });

  return {
    message: `Hello, ${name}!`,
    timestamp: Date.now(),  // number, not Date
  };
}

registerAction('getGreeting', getGreeting);
```

### Server Component

```typescript
"use server";

import { invokeAction } from '@capsulersc/core';
import { renderToPayload } from '@capsulersc/runtime';

export async function renderGreeting(input: { name: string }) {
  const result = await invokeAction<{ message: string; timestamp: number }>(
    'getGreeting',
    input
  );

  return renderToPayload({
    type: 'GreetingCard',
    props: {
      message: result.message,
      timestamp: result.timestamp,
    },
  });
}
```

### Client Component

```typescript
"use client";

import { hydratePayload, type SerializablePayload } from '@capsulersc/runtime';

export function displayGreeting(payload: SerializablePayload) {
  const { props } = hydratePayload(payload);
  console.log(props.message);
}
```

## Development

```bash
# Clone and install
git clone https://github.com/yuuichieguchi/capsule-rsc.git
cd capsule-rsc
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Run tests with coverage
pnpm test:coverage

# Type check all packages
pnpm type-check

# Run example demo
cd examples/basic && pnpm demo
```

## License

MIT
