"use client";

/**
 * Client Component: GreetingCard
 *
 * Demonstrates:
 * - Client-only component with "use client" directive
 * - Using hydratePayload to restore serializable payload
 * - Rendering hydrated data as React JSX
 * - Error handling with SerializationError
 */

import { hydratePayload, type SerializablePayload, SerializationError } from '@capsulersc/runtime';

interface GreetingCardProps {
  payload: SerializablePayload;
}

interface GreetingProps {
  message: string;
  timestamp: number;
  userName: string;
  locale: string;
}

interface ChildElement {
  type: string;
  props: Record<string, unknown>;
}

/**
 * Error display component for handling serialization errors
 */
function ErrorCard({ message }: { message: string }) {
  return (
    <div className="greeting-card error">
      <h2>Error</h2>
      <p className="error-message">{message}</p>
    </div>
  );
}

export function GreetingCard({ payload }: GreetingCardProps) {
  // Use try-catch to handle potential SerializationError
  try {
    // Use hydratePayload to restore the server element
    const result = hydratePayload(payload);

    // Extract props from the hydrated result
    const { message, timestamp, userName, locale } = result.props as unknown as GreetingProps;

    const date = new Date(timestamp);

    return (
      <div className="greeting-card">
        <div className="greeting-header">
          <h2>Welcome, {userName}!</h2>
          <span className="locale-badge">{locale.toUpperCase()}</span>
        </div>

        <p className="message">{message}</p>

        <div className="metadata">
          <p className="timestamp">
            Generated: {date.toLocaleString()}
          </p>
        </div>

        <div className="children-section">
          <h3>Server Element Children:</h3>
          <ul className="children-list">
            {/* Use stable key based on child type and props instead of array index */}
            {result.children.map((child: ChildElement) => (
              <li key={`${child.type}-${JSON.stringify(child.props)}`} className="child-item">
                <strong>{child.type}:</strong>{' '}
                <code>{JSON.stringify(child.props)}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    // Handle SerializationError from @capsulersc/runtime
    if (error instanceof SerializationError) {
      return <ErrorCard message={`Serialization error: ${error.message}`} />;
    }
    // Re-throw unexpected errors
    throw error;
  }
}
