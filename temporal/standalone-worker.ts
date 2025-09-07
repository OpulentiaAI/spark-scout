import { Worker } from '@temporalio/worker';
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
  return await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'chat-processing',
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
      process.exit(1);
    }
  })();
}
