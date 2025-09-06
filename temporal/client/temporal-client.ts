import { Client, Connection } from '@temporalio/client';

let clientInstance: Client | null = null;

export class TemporalClientManager {
  static async getInstance(): Promise<Client> {
    if (clientInstance) return clientInstance;

    const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
    const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

    const connection = await Connection.connect({
      address,
      tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    });

    clientInstance = new Client({ connection, namespace });
    return clientInstance;
  }
}

