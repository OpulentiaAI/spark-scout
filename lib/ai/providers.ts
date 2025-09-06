import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { getImageModelDefinition, getModelDefinition } from './all-models';
import { gateway } from '@ai-sdk/gateway';
import type { ImageModelId, ModelId } from '../models/model-id';
import { getModelAndProvider } from '../models/utils';

export let lastLanguageProviderPath: 'openai' | 'gateway' | null = null;

const telemetryConfig = {
  telemetry: {
    isEnabled: true,
    functionId: 'get-language-model',
  },
};

export const getLanguageModel = (modelId: ModelId) => {
  const model = getModelDefinition(modelId);
  const { model: shortId, provider } = getModelAndProvider(modelId);

  // Prefer direct provider when available (avoids Gateway env requirements)
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ 
      apiKey: process.env.OPENAI_API_KEY
    });
    const lm = openai(shortId);
    lastLanguageProviderPath = 'openai';
    return model.features?.reasoning && model.owned_by === 'xai'
      ? wrapLanguageModel({
          model: lm,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        })
      : lm;
  }

  // Fallback to Gateway (expects Gateway to be configured via env)
  const languageProvider = gateway(model.id);
  lastLanguageProviderPath = 'gateway';
  return model.features?.reasoning && model.owned_by === 'xai'
    ? wrapLanguageModel({
        model: languageProvider,
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      })
    : languageProvider;
};

export const getImageModel = async (modelId: ImageModelId) => {
  const model = getImageModelDefinition(modelId);
  const { model: modelIdShort, provider } = getModelAndProvider(modelId);

  if (model.owned_by === 'openai') {
    const { createOpenAI } = await import('@ai-sdk/openai');
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai.image(modelIdShort);
  }
  throw new Error(`Provider ${model.owned_by} not supported`);
};

// Note: Avoid eager provider initialization to prevent build-time env issues.

export const getModelProviderOptions = (
  providerModelId: ModelId,
):
  | {
      openai: OpenAIResponsesProviderOptions;
    }
  | {
      anthropic: AnthropicProviderOptions;
    }
  | {
      xai: Record<string, never>;
    }
  | {
      google: GoogleGenerativeAIProviderOptions;
    }
  | Record<string, never> => {
  const model = getModelDefinition(providerModelId);
  if (model.owned_by === 'openai') {
    if (model.features?.reasoning) {
      return {
        openai: {
          reasoningSummary: 'auto',
          ...(model.id === 'openai/gpt-5' ||
          model.id === 'openai/gpt-5-mini' ||
          model.id === 'openai/gpt-5-nano'
            ? { reasoningEffort: 'low' }
            : {}),
        } satisfies OpenAIResponsesProviderOptions,
      };
    } else {
      return { openai: {} };
    }
  } else if (model.owned_by === 'anthropic') {
    if (model.features?.reasoning) {
      return {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: 4096,
          },
        } satisfies AnthropicProviderOptions,
      };
    } else {
      return { anthropic: {} };
    }
  } else if (model.owned_by === 'xai') {
    return {
      xai: {},
    };
  } else if (model.owned_by === 'google') {
    if (model.features?.reasoning) {
      return {
        google: {
          thinkingConfig: {
            thinkingBudget: 10000,
          },
        },
      };
    } else {
      return { google: {} };
    }
  } else {
    return {};
  }
};
