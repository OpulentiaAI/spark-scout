import type { ImageModelId, ModelId } from '@/lib/models/model-id';
import { DEFAULT_CHAT_IMAGE_COMPATIBLE_MODEL } from '@/lib/ai/all-models';

export function getModelAndProvider(modelId: ModelId | ImageModelId | undefined) {
  const safeId =
    typeof modelId === 'string' && modelId.includes('/')
      ? modelId
      : (DEFAULT_CHAT_IMAGE_COMPATIBLE_MODEL as string);
  const [provider, model] = safeId.split('/');
  return { provider, model };
}
