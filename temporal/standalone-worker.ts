import { Worker, NativeConnection } from '@temporalio/worker';
import { Context } from '@temporalio/activity';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Simple activities that don't depend on complex lib structure
const activities = {
  async generateChatResponse(conversation: any[], modelConfig: any): Promise<string> {
    const context = Context.current();
    context.log.info('Generating chat response', { model: modelConfig.model });
    context.heartbeat();
    return `Response from ${modelConfig.provider}/${modelConfig.model}`;
  },

  async executeWebSearch(params: any): Promise<any> {
    const context = Context.current();
    context.log.info('Executing web search', { query: params.query });
    context.heartbeat();
    
    // Lazy load Tavily only when needed
    if (process.env.TAVILY_API_KEY) {
      try {
        const { tavily } = await import('@tavily/core');
        const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
        const result = await client.search(params.query || params.q || '', {
          maxResults: params.maxResults || 5
        });
        return { searches: result.results, query: params.query };
      } catch (error) {
        context.log.error('Tavily search failed', { error });
        return { error: 'Search failed', query: params.query };
      }
    }
    
    return { error: 'No search API configured', query: params.query };
  },

  async generateImage(params: { prompt?: string }): Promise<any> {
    const context = Context.current();
    context.log.info('Generating image', { prompt: params.prompt });
    context.heartbeat();
    
    if (!process.env.OPENAI_API_KEY) {
      return { error: 'OPENAI_API_KEY not configured', prompt: params.prompt };
    }
    
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: params.prompt || 'A beautiful landscape',
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      return {
        url: response.data?.[0]?.url || null,
        prompt: params.prompt
      };
    } catch (error) {
      context.log.error('Image generation failed', { error });
      return { error: 'Image generation failed', prompt: params.prompt };
    }
  },

  async executeCapyTool(params: any): Promise<any> {
    const context = Context.current();
    context.log.info('Executing Capy tool', { tool: params.tool });
    context.heartbeat();
    return { result: 'Capy tool executed', params };
  },

  async saveToDatabase(conversation: any[], modelConfig: any): Promise<void> {
    const context = Context.current();
    context.log.info('Saving to database', { model: modelConfig.model });
    context.heartbeat();
    // TODO: Implement database saving
  }
};

async function createChatWorker() {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const tlsEnv = (process.env.TEMPORAL_TLS || '').toLowerCase();
  const useTLS = tlsEnv === 'true' || tlsEnv === '1';
  const apiKey = process.env.TEMPORAL_API_KEY;

  console.log('[Temporal Worker] Connecting', {
    address,
    namespace,
    tls: useTLS,
    apiKeyConfigured: Boolean(apiKey),
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'chat-processing',
  });

  // Create connection to Temporal server
  const connection = await NativeConnection.connect({
    address,
    tls: useTLS ? {} : undefined,
    apiKey,
  });

  // Concurrency and cache tuning (env overridable)
  const maxCachedWorkflows = process.env.TEMPORAL_MAX_CACHED_WORKFLOWS
    ? Math.max(2, Number(process.env.TEMPORAL_MAX_CACHED_WORKFLOWS) || 0)
    : undefined;
  const maxConcurrentWFT = process.env.TEMPORAL_MAX_CONCURRENT_WFT
    ? Math.max(2, Number(process.env.TEMPORAL_MAX_CONCURRENT_WFT) || 0)
    : undefined;
  const maxConcurrentAT = process.env.TEMPORAL_MAX_CONCURRENT_AT
    ? Math.max(1, Number(process.env.TEMPORAL_MAX_CONCURRENT_AT) || 0)
    : undefined;
  const stickyS2ST = process.env.TEMPORAL_STICKY_SCHEDULE_TO_START_TIMEOUT || undefined; // e.g., '10s'

  return await Worker.create({
    connection,
    namespace,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'chat-processing',
    ...(maxCachedWorkflows !== undefined ? { maxCachedWorkflows } : {}),
    ...(maxConcurrentWFT !== undefined
      ? { maxConcurrentWorkflowTaskExecutions: maxConcurrentWFT }
      : {}),
    ...(maxConcurrentAT !== undefined
      ? { maxConcurrentActivityTaskExecutions: maxConcurrentAT }
      : {}),
    ...(stickyS2ST ? { stickyQueueScheduleToStartTimeout: stickyS2ST as any } : {}),
  });
}

// Main execution
if (process.argv[1]?.includes('standalone-worker.ts')) {
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
  })();
}
