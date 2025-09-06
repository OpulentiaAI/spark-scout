'use client';

import { useState, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { motion } from 'motion/react';
import { ChevronDown, Zap, Brain, Sparkles } from 'lucide-react';
import { TextMorph } from '@/components/motion-ui/text-morph';
import { useTemporalChat } from '@/hooks/useTemporalChat';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  icon?: React.ComponentType<any>;
}

interface ModelGroup {
  label: string;
  models: ModelOption[];
}

export function TextMorphDropdown() {
  const TRANSITION = {
    type: 'spring',
    stiffness: 280,
    damping: 18,
    mass: 0.3,
  } as const;

  const [selectedModel, setSelectedModel] = useState<ModelOption>({
    id: 'gpt-4o-mini',
    name: 'GPT‑4o mini',
    provider: 'OpenAI',
    capabilities: ['reasoning', 'coding', 'analysis'],
  });

  const { updateModel, isUpdating } = useTemporalChat();

  const modelGroups: ModelGroup[] = [
    {
      label: 'OpenAI',
      models: [
        { id: 'o3', name: 'o3', provider: 'OpenAI', capabilities: ['reasoning'], icon: Brain },
        { id: 'gpt-4o', name: 'GPT‑4o', provider: 'OpenAI', capabilities: ['multimodal'], icon: Sparkles },
        { id: 'gpt-4.1', name: 'GPT‑4.1', provider: 'OpenAI', capabilities: ['general'], icon: Zap },
        { id: 'gpt-4o-mini', name: 'GPT‑4o mini', provider: 'OpenAI', capabilities: ['efficient'] },
      ],
    },
    {
      label: 'Anthropic',
      models: [
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', capabilities: ['reasoning', 'coding'] },
      ],
    },
    {
      label: 'Google',
      models: [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', capabilities: ['multimodal'] },
      ],
    },
  ];

  const handleModelSelect = useCallback(
    async (model: ModelOption) => {
      setSelectedModel(model);
      await updateModel({
        model: model.id,
        provider: model.provider,
        capabilities: model.capabilities,
      });
    },
    [updateModel],
  );

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            data-testid="model-selector"
            layout="size"
            className="overflow-hidden rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-accent disabled:opacity-50"
            transition={TRANSITION}
            disabled={isUpdating}
          >
            <motion.div
              layout="preserve-aspect"
              className="inline-flex items-center gap-2"
              transition={TRANSITION}
            >
              <span className="text-muted-foreground text-sm">Chat model</span>
              <TextMorph className="font-medium text-sm">{selectedModel.name}</TextMorph>
              <motion.div animate={{ rotate: 0 }} whileHover={{ rotate: 180 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
              {isUpdating && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full"
                />
              )}
            </motion.div>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="shadow-lg min-w-[240px]">
          {modelGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                {group.label}
              </DropdownMenuLabel>
              {group.models.map((model) => {
                const Icon = model.icon;
                return (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className="flex items-center gap-2 px-2 py-2 cursor-pointer"
                    data-testid={`model-selector-item-${model.id}`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.capabilities.join(', ')}
                      </span>
                    </div>
                    {selectedModel.id === model.id && (
                      <motion.div
                        layoutId="selected-indicator"
                        className="ml-auto h-2 w-2 bg-primary rounded-full"
                        transition={TRANSITION}
                      />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

