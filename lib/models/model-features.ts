import type { ImageModelId } from '@/lib/models/model-id';
import type { ModelId } from '@/lib/models/model-id';
import { generatedModelFeatures } from './model-features.generated';

export interface ModelFeatures {
  reasoning: boolean;
  toolCall: boolean;
  knowledgeCutoff?: Date;
  input: {
    image: boolean;
    text: boolean;
    pdf: boolean;
    video: boolean;
    audio: boolean;
  };
  output: {
    image: boolean;
    text: boolean;
    audio: boolean;
  };
  releaseDate: Date;
  // temperature: boolean; // TODO: does it replace fixedTemperature?
  // last updated: Date;
  // weights: "Open" | "Closed"
  fixedTemperature?: number;
}

// All the literals in ModelId that are not keys of generatedModelFeatures
type GeneratedModelFeaturesModelId = keyof typeof generatedModelFeatures;
type CustomModelFeaturesModelId = Exclude<
  ModelId,
  GeneratedModelFeaturesModelId
>;

// Base, hand-curated features. Do not remove entries unless truly wrong.
const customModelFeatures: Record<CustomModelFeaturesModelId, ModelFeatures> = {
  'google/gemini-2.5-flash-lite': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-06-17'),
    knowledgeCutoff: new Date('2025-01-01'),
    input: {
      image: true,
      text: true,
      pdf: true,
      video: false,
      audio: true,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'openai/gpt-3.5-turbo': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2023-03-01'),
    knowledgeCutoff: new Date('2021-09-01'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'openai/gpt-3.5-turbo-instruct': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2023-08-22'),
    knowledgeCutoff: new Date('2021-09-01'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'zai/glm-4.5': {
    reasoning: true,
    toolCall: true,
    releaseDate: new Date('2025-07-28'),
    knowledgeCutoff: new Date('2024-04-01'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'zai/glm-4.5-air': {
    reasoning: true,
    toolCall: true,
    releaseDate: new Date('2025-07-28'),
    knowledgeCutoff: new Date('2024-04-01'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  // Cohere Command family (official: docs.cohere.com)
  'cohere/command-a': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-10-21'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'cohere/command-r': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-03-12'),
    input: {
      image: false,
      video: false,
      text: true,
      pdf: false,
      audio: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'cohere/command-r-plus': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-03-12'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  // Meta Llama 3.2 Vision Instruct (official: ai.meta.com)
  'meta/llama-3.2-11b': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2024-09-25'),
    input: {
      image: true,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'meta/llama-3.2-90b': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2024-09-25'),
    input: {
      image: true,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  // Perplexity Sonar (official: docs.perplexity.ai)
  'perplexity/sonar': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2023-12-15'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'perplexity/sonar-pro': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2024-03-12'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'perplexity/sonar-reasoning': {
    reasoning: true,
    toolCall: false,
    releaseDate: new Date('2024-03-12'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'perplexity/sonar-reasoning-pro': {
    reasoning: true,
    toolCall: false,
    releaseDate: new Date('2024-05-01'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'deepseek/deepseek-v3': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-03-24'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'deepseek/deepseek-v3.1': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-07-10'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'deepseek/deepseek-v3.1-base': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-07-10'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'deepseek/deepseek-v3.1-thinking': {
    reasoning: true,
    toolCall: true,
    releaseDate: new Date('2025-07-10'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  // Google Gemma
  'google/gemma-2-9b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-06-27'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  // Inception
  'inception/mercury-coder-small': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2025-02-01'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  // Meta Llama (text-only)
  'meta/llama-3-70b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-04-18'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'meta/llama-3-8b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-04-18'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'meta/llama-3.1-70b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-07-23'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'meta/llama-3.1-8b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-07-23'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'meta/llama-3.2-1b': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2024-09-25'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'meta/llama-3.2-3b': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2024-09-25'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  'mistral/devstral-small': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-06-26'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  // Zhipu AI (ZAI)
  'zai/glm-4.5v': {
    reasoning: true,
    toolCall: true,
    releaseDate: new Date('2025-08-11'),
    input: {
      image: true,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  // Alibaba Qwen3 (text-only here)
  'alibaba/qwen-3-14b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-07-15'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'alibaba/qwen-3-235b': {
    reasoning: true,
    toolCall: true,
    releaseDate: new Date('2025-07-15'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'alibaba/qwen-3-30b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-07-15'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'alibaba/qwen-3-32b': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-07-15'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'alibaba/qwen3-coder': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-07-15'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  // Qwen provider (OpenRouter routing)
  'qwen/qwen3-max': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2025-09-05'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },

  'google/gemini-2.5-flash-image-preview': {
    reasoning: false,
    toolCall: false,
    releaseDate: new Date('2025-06-17'),
    knowledgeCutoff: new Date('2025-06-01'),
    input: {
      image: true,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: true,
      text: true,
      audio: false,
    },
  },
  'mistral/mistral-medium': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2023-12-11'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
  'xai/grok-code-fast-1': {
    reasoning: false,
    toolCall: true,
    releaseDate: new Date('2024-04-12'),
    input: {
      image: false,
      text: true,
      pdf: false,
      audio: false,
      video: false,
    },
    output: {
      image: false,
      text: true,
      audio: false,
    },
  },
};

export const modelFeatures = {
  ...generatedModelFeatures,
  ...customModelFeatures,
};

export const imageModelsFeatures: Partial<Record<ImageModelId, ModelFeatures>> =
  {
    'openai/gpt-image-1': {
      reasoning: false,
      toolCall: false,
      releaseDate: new Date('2023-11-06'),
      knowledgeCutoff: new Date('2025-04-01'),
      input: {
        video: false,
        image: true,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: true,
        text: false,
        audio: false,
      },
    },
  };
