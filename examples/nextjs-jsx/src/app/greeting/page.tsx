import Link from 'next/link';
import { renderGreeting } from '../../server/components/Greeting.server';
import { GreetingCard } from '../../client/components/GreetingCard';

export default async function GreetingPage() {
  // Server: Call renderGreeting which uses invokeAction + renderToPayload
  // This demonstrates the complete server-side flow:
  // 1. invokeAction calls the registered 'getGreeting' action
  // 2. renderToPayload converts the ServerElement to SerializablePayload
  const payloadEn = await renderGreeting({ name: 'World', locale: 'en' });
  const payloadJa = await renderGreeting({ name: 'World', locale: 'ja' });
  const payloadEs = await renderGreeting({ name: 'World', locale: 'es' });

  return (
    <div className="container">
      <h1>@capsulersc Greeting Demo</h1>
      <p>
        This page demonstrates the complete @capsulersc flow:
      </p>
      <div className="code-block">
        <pre>
{`registerAction -> invokeAction -> renderToPayload -> hydratePayload`}
        </pre>
      </div>

      <h2>English Greeting</h2>
      {/* Client: GreetingCard uses hydratePayload to restore the data */}
      <GreetingCard payload={payloadEn} />

      <h2>Japanese Greeting</h2>
      <GreetingCard payload={payloadJa} />

      <h2>Spanish Greeting</h2>
      <GreetingCard payload={payloadEs} />

      <h2>How It Works</h2>
      <ol className="feature-list">
        <li>
          <strong>Server Action</strong>: <code>get-greeting.ts</code> registers
          the &apos;getGreeting&apos; action using <code>registerAction</code>
        </li>
        <li>
          <strong>Server Component</strong>: <code>Greeting.server.ts</code>{' '}
          calls <code>invokeAction</code> and builds a <code>ServerElement</code>{' '}
          tree
        </li>
        <li>
          <strong>Serialization</strong>: <code>renderToPayload</code> converts
          the tree to <code>SerializablePayload</code>
        </li>
        <li>
          <strong>Client Component</strong>: <code>GreetingCard.tsx</code> uses{' '}
          <code>hydratePayload</code> to restore and render the data
        </li>
      </ol>

      <Link href="/" className="back-link">
        Back to Home
      </Link>
    </div>
  );
}
