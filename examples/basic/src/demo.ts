/**
 * CapsuleRSC Demo
 *
 * This demo shows the complete flow:
 * 1. Register server action
 * 2. Server component renders to serializable payload
 * 3. Client component hydrates and displays the payload
 */

// Import server-side (would be in server environment)
import './server/actions/get-greeting.js';
import { renderGreeting } from './server/components/Greeting.server.js';

// Import client-side (would be in browser environment)
import { displayGreeting } from './client/components/Greeting.client.js';

async function main() {
  console.log('='.repeat(60));
  console.log('CapsuleRSC Demo - Safe Server/Client Boundaries');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Server renders greeting to serializable payload
  console.log('[Server] Rendering greeting...');
  const payload = await renderGreeting({
    name: 'Alice',
    locale: 'ja',
  });

  console.log('[Server] Payload generated:');
  console.log(JSON.stringify(payload, null, 2));
  console.log();

  // Step 2: Payload is "sent" to client (in real app, via network)
  console.log('[Network] Sending payload to client...');
  console.log();

  // Step 3: Client hydrates and displays
  console.log('[Client] Hydrating and displaying:');
  displayGreeting(payload);

  console.log();
  console.log('='.repeat(60));
  console.log('Demo complete!');
  console.log();
  console.log('Key points demonstrated:');
  console.log('1. Server action uses caps.log (not console.log directly)');
  console.log('2. Props are validated as Serializable at render time');
  console.log('3. Payload crosses boundary as JSON-safe data');
  console.log('4. Client hydrates without knowing server implementation');
  console.log('='.repeat(60));
}

main().catch(console.error);
