import { Client, Connection } from '@temporalio/client';

let clientInstance: Client | null = null;

export class TemporalClientManager {
  static async getInstance(): Promise<Client> {
    if (clientInstance) return clientInstance;

    const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
    const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
    const tlsEnv = (process.env.TEMPORAL_TLS || '').toLowerCase();
    const useTLS = tlsEnv === 'true' || tlsEnv === '1';

    const connection = await Connection.connect({
      address,
      // Allow non-TLS in production when connecting to self-hosted Temporal/Temporalite
      tls: useTLS ? {} : undefined,
      // Temporal Cloud: provide API key if configured
      apiKey: process.env.TEMPORAL_API_KEY,
    });

    clientInstance = new Client({ connection, namespace });
    return clientInstance;
  }
}
