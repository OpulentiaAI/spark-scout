import { Client, Connection } from '@temporalio/client';

let clientInstance: Client | null = null;

export class TemporalClientManager {
  static async getInstance(): Promise<Client> {
    if (clientInstance) return clientInstance;

    const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
    const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
    const tlsEnv = (process.env.TEMPORAL_TLS || '').toLowerCase();
    const useTLS = tlsEnv === 'true' || tlsEnv === '1';

    const apiKey = process.env.TEMPORAL_API_KEY;

    // Lightweight retry for initial connection during cold start
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const maxAttempts = 3;
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const connection = await Connection.connect({
          address,
          tls: useTLS ? {} : undefined,
          apiKey,
        });
        clientInstance = new Client({ connection, namespace });
        console.info('[TemporalClient] Connected', {
          address,
          namespace,
          tls: useTLS,
          apiKeyConfigured: Boolean(apiKey),
        });
        return clientInstance;
      } catch (err) {
        lastErr = err;
        const backoff = 200 * attempt + Math.floor(Math.random() * 200);
        console.warn('[TemporalClient] Connect failed; retrying', {
          attempt,
          maxAttempts,
          backoff,
          address,
          namespace,
        });
        await sleep(backoff);
      }
    }
    console.error('[TemporalClient] Failed to connect to Temporal', {
      address,
      namespace,
      tls: useTLS,
    });
    throw lastErr instanceof Error ? lastErr : new Error('Temporal connect failed');
  }
}
