# Security Policy

## Overview

CapsuleRSC enforces safe server/client boundaries through a three-layer defense system. This document describes what is enforced in the current MVP and what is planned for future versions.

## What is Enforced (MVP)

### Type-level Enforcement

| Feature | Status | Description |
|---------|--------|-------------|
| `Serializable` type | Enforced | Compile-time type checking for serializable values |
| `ServerAction<I, O>` | Enforced | Typed action handlers with serializable constraints |
| `SerializablePayload` | Enforced | Typed payload structure |

### Build-time Enforcement (ESLint)

| Rule | Status | Description |
|------|--------|-------------|
| `no-cross-boundary-import` | Enforced | Prevents server/client file cross-imports |
| `no-forbidden-server-apis` | Enforced | Blocks `eval`, `new Function`, dynamic `import()` |
| `no-direct-fetch` | Enforced | Blocks direct `fetch()` in server files |
| `no-process-env` | Enforced | Blocks direct `process.env` access in server files |

### Runtime Enforcement

| Feature | Status | Description |
|---------|--------|-------------|
| `assertSerializable` | Enforced | Validates values at runtime with path tracking |
| Circular reference detection | Enforced | Prevents infinite loops during validation |
| Non-finite number detection | Enforced | Rejects NaN, Infinity, -Infinity |
| Class instance detection | Enforced | Rejects Date, Map, Set, custom classes |
| Action input validation | Enforced | Validates before handler invocation |
| Action output validation | Enforced | Validates after handler returns |

### HTTP Capability Security

| Feature | Status | Description |
|---------|--------|-------------|
| Host allowlist | Enforced | Only requests to allowed hosts permitted |
| Protocol restriction | Enforced | Only `http:` and `https:` allowed |
| Method restriction | Enforced | Only GET and POST allowed (MVP) |
| Timeout | Enforced | Default 30s, configurable per-request |
| Request body validation | Enforced | Body validated as serializable before sending |

## What is NOT Enforced (MVP Limitations)

### ESLint Rule Limitations

| Limitation | Description |
|------------|-------------|
| Alias paths | `@/`, `~/` import paths not resolved |
| node_modules | External package imports not analyzed |
| Dynamic paths | `import(variable)` not statically analyzed |
| Shadowing | `const f = fetch; f()` not detected |
| Optional chaining | `process?.env` not detected |
| Destructuring | `const { env } = process` not detected |
| globalThis | `globalThis.fetch()` not detected |

### Runtime Limitations

| Limitation | Description |
|------------|-------------|
| Streaming | No streaming payload support |
| Suspense | No Suspense integration |
| RSC Protocol | Not compatible with Next.js RSC protocol |
| Performance | No optimization for large payloads |
| Max depth | No configurable recursion limit (uses stack) |

## Security Recommendations

### For Users

1. **Always use the ESLint plugin** - It catches many issues before runtime
2. **Never disable ESLint rules** without understanding the implications
3. **Use typed actions** with `ServerAction<I, O>` for better type safety
4. **Keep allowlists minimal** - Only add necessary hosts
5. **Set appropriate timeouts** - Don't use infinite timeouts

### For Production

1. **Run type checking in CI** - `pnpm type-check` catches type errors
2. **Run linting in CI** - `pnpm lint` catches boundary violations
3. **Consider adding integration tests** - Verify payload serialization
4. **Monitor for serialization errors** - Log and alert on failures

## Future Roadmap

### Planned Improvements

- [ ] Maximum recursion depth configuration
- [ ] Request/response logging hooks
- [ ] Retry logic for HTTP capability
- [ ] Alias path resolution in ESLint rules
- [ ] Optional chaining detection
- [ ] Streaming payload support
- [ ] Performance optimization for large payloads

### Not Planned (Out of Scope)

- Full RSC protocol compatibility (use Next.js for that)
- React component rendering
- CSS/styling support
- Bundling/building

## Reporting Security Issues

If you discover a security vulnerability, please report it by:

1. Opening a GitHub issue with the `security` label
2. Describing the vulnerability and how to reproduce it
3. Suggesting a fix if possible

Please do not disclose security vulnerabilities publicly until they are addressed.
