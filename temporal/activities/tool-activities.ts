// Activity mappings into existing tool implementations under lib/ai/tools/*
// These provide a minimal bridge so Temporal workflows can leverage current logic.

import { multiQueryWebSearchStep } from '@/lib/ai/tools/steps/multi-query-web-search';
import { generateImage as generateImageTool } from '@/lib/ai/tools/generate-image';
import { retrieve as retrieveTool } from '@/lib/ai/tools/retrieve';
import { codeInterpreter as codeInterpreterTool } from '@/lib/ai/tools/code-interpreter';

// No-op writer to satisfy functions that expect a StreamWriter
const noopWriter = {
  write: (_msg: any) => {
    /* no-op */
  },
};

export async function executeWebSearch(params: {
  q?: string;
  query?: string;
  search_queries?: Array<{ query: string; maxResults?: number | null }>;
  topics?: Array<'general' | 'news'> | null;
  searchDepth?: 'basic' | 'advanced' | null;
  exclude_domains?: string[] | null;
  maxResults?: number;
}) {
  const queryText = params.q || params.query;
  const queries = params.search_queries?.length
    ? params.search_queries.map((q) => ({ query: q.query, maxResults: q.maxResults ?? 5 }))
    : [{ query: queryText || '', maxResults: params.maxResults ?? 5 }];

  // Prefer Firecrawl if available, otherwise Tavily
  const provider: 'firecrawl' | 'tavily' = process.env.FIRECRAWL_API_KEY
    ? 'firecrawl'
    : 'tavily';

  const { searches, error } = await multiQueryWebSearchStep({
    queries,
    options: {
      baseProviderOptions: { provider },
      topics: params.topics ?? ['general'],
      excludeDomains: params.exclude_domains ?? [],
    },
    // @ts-expect-error: accept noop writer in activity context
    dataStream: noopWriter,
  });

  return { searches, error, query: queryText };
}

export async function generateImage(params: { prompt?: string }) {
  const prompt = params.prompt || '';
  if (!process.env.OPENAI_API_KEY) {
    return { error: 'OPENAI_API_KEY not configured', prompt };
  }
  const tool = generateImageTool();
  const result = await (tool as any).execute({ prompt }, undefined as any);
  return result;
}

export async function analyzeDocument(params: { url?: string; id?: string }) {
  // Prefer URL retrieval for now; ID-based reads require session context.
  if (params.url) {
    const result = await (retrieveTool as any).execute({ url: params.url }, undefined as any);
    return result;
  }
  return { error: 'Unsupported parameters: provide url', params };
}

export async function executeCode(params: { code: string; title?: string; icon?: string }) {
  if (!process.env.E2B_API_KEY || !process.env.SANDBOX_TEMPLATE_ID) {
    return {
      message: 'Code sandbox not configured',
      chart: '',
    };
  }
  const { code, title = 'Code Execution', icon = 'default' } = params;
  const result = await (codeInterpreterTool as any).execute({ code, title, icon }, undefined as any);
  return result;
}
