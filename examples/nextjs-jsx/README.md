# @capsulersc/example-nextjs-jsx

A Next.js App Router example demonstrating the complete @capsulersc workflow for safe server/client boundaries.

## Features Demonstrated

### @capsulersc/core
- `registerAction` - Register server actions
- `invokeAction` - Call registered actions
- `LogCapability` - Structured logging
- `HttpCapability` - HTTP requests with host allowlist
- `Serializable` type - Type safety for boundary crossing

### @capsulersc/runtime
- `ServerElement` - Build server element tree
- `renderToPayload` - Convert to serializable payload
- `hydratePayload` - Restore payload on client

### @capsulersc/compiler
- `no-cross-boundary-import` - Prevent server/client import violations
- `no-forbidden-server-apis` - Forbid eval, new Function in server files
- `no-direct-fetch` - Forbid direct fetch() in server files
- `no-process-env` - Forbid direct process.env access in server files

## Project Structure

```
src/
├── shared/
│   └── types.ts              # Shared types (no directive)
├── server/
│   ├── actions/
│   │   ├── get-greeting.ts   # "use server" - registerAction, LogCapability
│   │   └── fetch-user.ts     # "use server" - HttpCapability, HttpError
│   └── components/
│       └── Greeting.server.ts # "use server" - invokeAction, renderToPayload
├── client/
│   └── components/
│       └── GreetingCard.tsx  # "use client" - hydratePayload
└── app/
    ├── layout.tsx
    ├── page.tsx
    ├── globals.css
    └── greeting/
        └── page.tsx
```

## Data Flow

```
1. Server Action (registerAction)
   -> Registered with @capsulersc/core

2. Server Component (invokeAction + renderToPayload)
   -> Calls action, builds ServerElement tree
   -> Converts to SerializablePayload

3. Network Transfer
   -> Payload is JSON-safe, crosses boundary

4. Client Component (hydratePayload)
   -> Restores payload, renders as React JSX
```

## Getting Started

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run development server
pnpm --filter @capsulersc/example-nextjs-jsx dev

# Run type checking
pnpm --filter @capsulersc/example-nextjs-jsx type-check

# Run ESLint
pnpm --filter @capsulersc/example-nextjs-jsx lint
```

## Key Files

### `src/server/actions/get-greeting.ts`
Demonstrates registering a server action with `registerAction` and using `LogCapability` for structured logging.

### `src/server/actions/fetch-user.ts`
Demonstrates using `HttpCapability` for secure HTTP requests with host allowlist validation.

### `src/server/components/Greeting.server.ts`
Demonstrates building a `ServerElement` tree and converting it to `SerializablePayload` using `renderToPayload`.

### `src/client/components/GreetingCard.tsx`
Demonstrates hydrating the payload on the client using `hydratePayload` and rendering it as React JSX.

### `src/app/greeting/page.tsx`
Server Component that orchestrates the complete flow - calling the server component and passing the payload to the client component.
