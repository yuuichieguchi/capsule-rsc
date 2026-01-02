# Basic Example

Conceptual understanding of CapsuleRSC through abstract TypeScript patterns (no JSX).

## Purpose: Conceptual Understanding

This example uses pure TypeScript without JSX or React to demonstrate the core concepts
of server/client boundaries. It focuses on:

1. **Serializable data types** - What can cross the boundary
2. **Server Actions** - How to safely expose server functionality
3. **Runtime validation** - How CapsuleRSC catches boundary violations
4. **ESLint rules** - How static analysis prevents errors

If you want to see these concepts applied in a real React application,
see [examples/nextjs-jsx](../nextjs-jsx/README.md).

## When to Use This Example

**Use this example if you:**

- Want to understand RSC concepts without React complexity
- Are learning how server/client boundaries work
- Want to see the underlying runtime mechanics
- Are implementing CapsuleRSC in a non-React environment

**Use nextjs-jsx instead if you:**

- Want to build a real Next.js application
- Are already familiar with React and Next.js
- Want to see practical JSX usage patterns
- Want a runnable web application

## Quick Start

```bash
# From repository root
pnpm install

# Navigate to this example
cd examples/basic

# Run the demo
pnpm demo
```

## File Structure

```
src/
├── demo.ts               # Main demo script - run this!
├── server/
│   ├── actions/
│   │   └── get-greeting.ts   # Server action with 'use server'
│   └── components/
│       └── Greeting.server.ts  # Server component (abstract)
├── client/
│   └── components/
│       └── Greeting.client.ts  # Client component (abstract)
├── shared/
│   └── types.ts              # Shared types (no directive)
└── failing-cases/            # Educational examples
    ├── date-serialization.ts.disabled
    ├── cross-boundary-import.ts.disabled
    └── direct-fetch.ts.disabled
```

## Key Concepts Demonstrated

### 1. Server/Client Separation

```typescript
// server/actions/get-greeting.ts
'use server';

export async function getGreeting(input: GetGreetingInput): Promise<GetGreetingOutput> {
  // Runs on server - has access to server capabilities
  return { message: `Hello, ${input.name}!`, timestamp: Date.now() };
}
```

### 2. Serializable Payload

```typescript
// The payload that crosses the boundary is always JSON-safe
const payload: SerializablePayload = {
  type: 'Greeting',
  props: {
    message: 'Hello, Alice!',
    timestamp: 1704067200000, // number, not Date
  },
};
```

### 3. Runtime Validation

```typescript
import { assertSerializable } from '@capsulersc/core';

// Throws SerializationError if data is not serializable
assertSerializable(payload);
```

### 4. ESLint Integration

```bash
# Catches boundary violations at lint time
pnpm lint
```

## Failing Cases

The `failing-cases/` directory contains examples of common mistakes:

### date-serialization.ts.disabled

```typescript
// ERROR: Date is not serializable
const payload = {
  createdAt: new Date(), // SerializationError!
};
```

### cross-boundary-import.ts.disabled

```typescript
'use server';
// ERROR: Server file importing client file
import { displayGreeting } from '../client/components/Greeting.client';
```

### direct-fetch.ts.disabled

```typescript
'use client';
// ERROR: Client code should not use server-only APIs
import { db } from '../server/db';
```

To test these, rename to `.ts` and run lint or the demo.

## Demo Output

When you run `pnpm demo`, you'll see:

```
============================================================
CapsuleRSC Demo - Safe Server/Client Boundaries
============================================================

[Server] Rendering greeting...
[Server] Payload generated:
{
  "type": "Greeting",
  "props": {
    "message": "こんにちは、Aliceさん！",
    "timestamp": 1704067200000
  }
}

[Network] Sending payload to client...

[Client] Hydrating and displaying:
┌──────────────────────────────────┐
│ こんにちは、Aliceさん！              │
│ Generated at: 2024-01-01 00:00   │
└──────────────────────────────────┘

============================================================
Demo complete!

Key points demonstrated:
1. Server action uses caps.log (not console.log directly)
2. Props are validated as Serializable at render time
3. Payload crosses boundary as JSON-safe data
4. Client hydrates without knowing server implementation
============================================================
```

## Next Steps

After understanding the concepts here, proceed to:

- [examples/nextjs-jsx](../nextjs-jsx/README.md) - Practical Next.js implementation
- [CapsuleRSC Core Documentation](../../packages/core/README.md) - API reference
- [ESLint Plugin](../../packages/compiler/README.md) - Static analysis rules
