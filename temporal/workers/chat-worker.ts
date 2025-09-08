import { Worker, NativeConnection } from '@temporalio/worker';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Simple activities for testing
const activities = {
  async generateChatResponse(
    _conversation: any[],
    modelConfig: any,
  ): Promise<string> {
    console.log('Generating chat response', { model: modelConfig.model });
    return `Response from ${modelConfig.provider}/${modelConfig.model}`;
  },

  async executeWebSearch(params: any): Promise<any> {
    console.log('Executing web search', { query: params.query });
    return { searches: [], query: params.query };
  },

  async generateImage(params: { prompt?: string }): Promise<any> {
    console.log('Generating image', { prompt: params.prompt });
    return { url: null, prompt: params.prompt };
  },

  async executeCapyTool(params: any): Promise<any> {
    console.log('Executing Capy tool', { tool: params.tool });
    return { result: 'Capy tool executed', params };
  },

  async saveToDatabase(_conversation: any[], modelConfig: any): Promise<void> {
    console.log('Saving to database', { model: modelConfig.model });
  },
};

export async function createChatWorker() {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const tlsEnv = (process.env.TEMPORAL_TLS || '').toLowerCase();
  const useTLS = tlsEnv === 'true' || tlsEnv === '1';
  const apiKey = process.env.TEMPORAL_API_KEY;

  // Helpful startup log to diagnose DNS / TLS issues
  console.log('[Temporal Worker] Connecting', {
    address,
    namespace,
    tls: useTLS,
    apiKeyConfigured: Boolean(apiKey),
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'chat-processing',
  });

  const connection = await NativeConnection.connect({
    address,
    tls: useTLS ? {} : undefined,
    apiKey,
  });

  return await Worker.create({
    connection,
    namespace,
    workflowsPath: require.resolve('../workflows'),
    activities,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'chat-processing',
  });
}

// Allow running directly: bun run tsx temporal/workers/chat-worker.ts
if (
  process.argv[1]?.includes('chat-worker') ||
  process.argv[1]?.endsWith('chat-worker.ts')
  ) {
    (async () => {
      try {
        const worker = await createChatWorker();
        console.log('Chat Worker starting...');
        await worker.run();
      } catch (err) {
        console.error('Worker failed to start:', err);
        console.error(
          '[Temporal Worker] Ensure TEMPORAL_ADDRESS is a resolvable host:port, TEMPORAL_NAMESPACE is correct, and TEMPORAL_TLS/API key match your server. For Temporalite on Railway, use the TCP endpoint host:port; do not use a Docker service name like "temporalite:7233".',
        );
        process.exit(1);
      }
    })().catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
