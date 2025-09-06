'use client';

import { useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { chatModels, getModelDefinition } from '@/lib/ai/all-models';
import type { ModelId } from '@/lib/models/model-id';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { LoginCtaBanner } from '@/components/upgrade-cta/login-cta-banner';
import {
  ModelSelectorBase,
  type ModelSelectorBaseItem,
} from '@/components/model-selector-base';
import { TextMorphDropdown } from '@/components/model-selector/TextMorphDropdown';
import { EnhancedTextMorphDropdown } from '@/components/model-selector/EnhancedTextMorphDropdown';

export function PureModelSelector({
  selectedModelId,
  className,
  onModelChangeAction,
}: {
  selectedModelId: ModelId;
  onModelChangeAction?: (modelId: ModelId) => void;
  className?: string;
}) {
  // Optional: enable alternate dropdown UX via env flags
  if (process.env.NEXT_PUBLIC_USE_ENHANCED_SELECTOR === 'true') {
    return <EnhancedTextMorphDropdown />;
  }
  if (process.env.NEXT_PUBLIC_USE_TEXTMORPH_SELECTOR === 'true') {
    return <TextMorphDropdown />;
  }
  const { data: session } = useSession();
  const isAnonymous = !session?.user;

  const models: Array<ModelSelectorBaseItem> = useMemo(() => {
    return chatModels.map((m) => {
      const def = getModelDefinition(m.id);
      const disabled =
        isAnonymous && !ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(m.id as any);
      return { id: m.id, definition: def, disabled };
    });
  }, [isAnonymous]);

  const hasDisabledModels = useMemo(
    () => models.some((m) => m.disabled),
    [models],
  );

  return (
    <ModelSelectorBase
      className={cn('w-fit md:px-2', className)}
      models={models}
      selectedModelId={selectedModelId}
      onModelChange={onModelChangeAction}
      topContent={
        hasDisabledModels ? (
          <div className="p-3">
            <LoginCtaBanner
              message="Sign in to unlock all models."
              variant="default"
              compact
            />
          </div>
        ) : null
      }
      enableFilters
    />
  );
}

export const ModelSelector = memo(PureModelSelector, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.className === nextProps.className &&
    prevProps.onModelChangeAction === nextProps.onModelChangeAction
  );
});
