import type { TavilySearchOptions } from '@tavily/core';
import FirecrawlApp, { type SearchParams } from '@mendable/firecrawl-js';
import type { StreamWriter } from '../../types';
import { createModuleLogger } from '../../../logger';

export type SearchProvider = 'tavily' | 'firecrawl';

export type SearchProviderOptions =
  | ({
      provider: 'tavily';
    } & Omit<TavilySearchOptions, 'limit'>)
  | ({
      provider: 'firecrawl';
    } & SearchParams);

export type WebSearchResult = {
  source: 'web';
  title: string;
  url: string;
  content: string;
};

export type WebSearchResponse = {
  results: WebSearchResult[];
  error?: string;
};

// Initialize providers lazily to avoid crashing when keys are missing
let tvly: any | null = null;
function getTavilyClient() {
  if (tvly) return tvly;
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const { tavily } = require('@tavily/core');
    tvly = tavily({ apiKey: key });
    return tvly;
  } catch {
    return null;
  }
}

let firecrawl: FirecrawlApp | null = null;
function getFirecrawlClient() {
  if (firecrawl) return firecrawl;
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  try {
    firecrawl = new FirecrawlApp({ apiKey: key });
    return firecrawl;
  } catch {
    return null;
  }
}

const log = createModuleLogger('tools/steps/web-search');

export async function webSearchStep({
  query,
  maxResults,
  providerOptions,
  dataStream,
}: {
  query: string;
  maxResults: number;
  dataStream: StreamWriter;
  providerOptions: SearchProviderOptions;
}): Promise<WebSearchResponse> {
  try {
    let results: WebSearchResult[] = [];

    if (providerOptions.provider === 'tavily') {
      const client = getTavilyClient();
      if (!client) {
        return {
          results: [],
          error:
            'Tavily search is not configured. Set TAVILY_API_KEY to enable web search.',
        };
      }
      const response = await client.search(query, {
        searchDepth: providerOptions.searchDepth || 'basic',
        maxResults,
        includeAnswer: true,
        ...providerOptions,
      });

      results = response.results.map((r) => ({
        source: 'web',
        title: r.title,
        url: r.url,
        content: r.content,
      }));
    } else if (providerOptions.provider === 'firecrawl') {
      const client = getFirecrawlClient();
      if (!client) {
        return {
          results: [],
          error:
            'Firecrawl search is not configured. Set FIRECRAWL_API_KEY to enable web search.',
        };
      }
      const response = await client.search(query, {
        timeout: providerOptions.timeout || 15000,
        limit: maxResults,
        scrapeOptions: { formats: ['markdown'] },
        ...providerOptions,
      });

      results = response.data.map((item) => ({
        source: 'web',
        title: item.title || '',
        url: item.url || '',
        content: item.markdown || '',
      }));
    }

    log.debug(
      { query, maxResults, provider: providerOptions.provider },
      'webSearchStep success',
    );
    return { results };
  } catch (error: unknown) {
    // Best-effort extraction without using `any`
    let message: string | undefined;
    let stack: string | undefined;
    let status: number | undefined;
    let data: unknown;

    if (typeof error === 'object' && error !== null) {
      if (
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        message = (error as { message: string }).message;
      }
      if (
        'stack' in error &&
        typeof (error as { stack: unknown }).stack === 'string'
      ) {
        stack = (error as { stack: string }).stack;
      }
      const maybeResp = (
        error as { response?: { status?: number; data?: unknown } }
      ).response;
      if (maybeResp) {
        status = maybeResp.status;
        data = maybeResp.data;
      }
    }

    log.error(
      {
        err: error,
        message,
        stack,
        status,
        data,
        query,
        providerOptions,
      },
      'Error in webSearchStep',
    );
    return {
      results: [],
      error: JSON.stringify(
        {
          message,
          status,
          data,
        },
        null,
        2,
      ),
    };
  }
}
