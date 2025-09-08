import { Worker } from '@temporalio/worker';
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
  return await Worker.create({
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
    const worker = await createChatWorker();
    console.log('Chat Worker starting...');
    await worker.run();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
