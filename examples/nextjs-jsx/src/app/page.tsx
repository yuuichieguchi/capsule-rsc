import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container">
      <h1>@capsulersc Demo</h1>
      <p>
        This is a Next.js App Router example demonstrating the complete
        @capsulersc workflow for safe server/client boundaries.
      </p>

      <h2>Features Demonstrated</h2>
      <ul className="feature-list">
        <li>
          <strong>@capsulersc/core</strong>: registerAction, invokeAction,
          LogCapability, Serializable type
        </li>
        <li>
          <strong>@capsulersc/runtime</strong>: ServerElement, renderToPayload,
          hydratePayload
        </li>
        <li>
          <strong>@capsulersc/compiler</strong>: ESLint rules for boundary
          enforcement
        </li>
      </ul>

      <h2>Data Flow</h2>
      <div className="code-block">
        <pre>
{`1. Server Action (registerAction)
   -> Registered with @capsulersc/core

2. Server Component (invokeAction + renderToPayload)
   -> Calls action, builds ServerElement tree
   -> Converts to SerializablePayload

3. Network Transfer
   -> Payload is JSON-safe, crosses boundary

4. Client Component (hydratePayload)
   -> Restores payload, renders as React JSX`}
        </pre>
      </div>

      <h2>ESLint Rules Active</h2>
      <ul className="feature-list">
        <li>no-cross-boundary-import: Prevents server/client import violations</li>
        <li>no-forbidden-server-apis: Forbids eval, new Function in server files</li>
        <li>no-direct-fetch: Forbids direct fetch() in server files</li>
        <li>no-process-env: Forbids direct process.env access in server files</li>
      </ul>

      <Link href="/greeting" className="nav-link">
        View Greeting Demo
      </Link>
    </div>
  );
}
