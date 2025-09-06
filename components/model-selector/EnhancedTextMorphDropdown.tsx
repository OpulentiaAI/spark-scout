'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TextMorph } from '@/components/motion-ui/text-morph';
import { useTemporalChat } from '@/hooks/useTemporalChat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Brain, Sparkles, AlertTriangle, Clock, ChevronDown } from 'lucide-react';

interface ModelCapability {
  name: string;
  description: string;
  compatibleTools: string[];
  limitations?: string[];
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  icon?: React.ComponentType<any>;
  riskLevel?: 'low' | 'medium' | 'high';
  approvalRequired?: boolean;
}

const TRANSITION = { type: 'spring', stiffness: 280, damping: 18, mass: 0.3 } as const;

function assessToolCompatibility(model: ModelOption): Record<string, boolean> {
  const allTools = [
    'ls',
    'read',
    'edit',
    'web_search',
    'image_generate',
    'bash_run',
    'lsp',
    'read_agent',
    'handoff',
    'computer',
    'socials_search',
  ];
  const compatibleTools = model.capabilities.flatMap((c) => c.compatibleTools);
  return allTools.reduce((acc, tool) => {
    acc[tool] = compatibleTools.includes(tool);
    return acc;
  }, {} as Record<string, boolean>);
}

function getTotalToolCount(): number {
  return 11;
}

export function EnhancedTextMorphDropdown() {
  const [selectedModel, setSelectedModel] = useState<ModelOption>({
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    capabilities: [
      {
        name: 'reasoning',
        description: 'Complex logical reasoning and analysis',
        compatibleTools: ['lsp', 'read_agent', 'web_search', 'bash_run'],
      },
      {
        name: 'coding',
        description: 'Code generation and debugging',
        compatibleTools: ['edit', 'multi_edit', 'lsp', 'bash_run', 'code_template'],
      },
    ],
    riskLevel: 'medium',
  });

  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [toolCompatibility, setToolCompatibility] = useState<Record<string, boolean>>({});

  const { updateModel, isUpdating, currentWorkflowId, requestApproval, getPendingApprovals, approveRequest, approvalWorkflowId } =
    useTemporalChat();

  const modelGroups = [
    {
      label: 'OpenAI',
      models: [
        {
          id: 'o3',
          name: 'o3',
          provider: 'OpenAI',
          capabilities: [
            {
              name: 'advanced-reasoning',
              description: 'State-of-the-art reasoning capabilities',
              compatibleTools: ['read_agent', 'lsp', 'handoff', 'web_search'],
              limitations: ['Higher latency', 'Requires approval for complex tasks'],
            },
          ],
          icon: Brain,
          riskLevel: 'high' as const,
          approvalRequired: true,
        },
        {
          id: '4o',
          name: '4o',
          provider: 'OpenAI',
          capabilities: [
            {
              name: 'multimodal',
              description: 'Text, image, and code understanding',
              compatibleTools: ['image_generate', 'image_edit', 'edit', 'web_search', 'computer'],
            },
          ],
          icon: Sparkles,
          riskLevel: 'medium' as const,
        },
      ],
    },
  ];

  const handleModelSelect = useCallback(
    async (model: ModelOption) => {
      if (model.approvalRequired) {
        const req = {
          id: `model-change-${model.id}-${Date.now()}`,
          toolName: 'model_change',
          parameters: { newModel: model.id, currentModel: selectedModel.id },
          reasoning: `Switching to ${model.name} for capabilities: ${model.capabilities
            .map((c) => c.name)
            .join(', ')}`,
          riskLevel: model.riskLevel || 'medium',
          timestamp: Date.now(),
          timeout: 300,
        };
        await requestApproval?.(req);
        setPendingApprovals((prev) => [...prev, req]);
        return;
      }

      setSelectedModel(model);
      const compatibility = assessToolCompatibility(model);
      setToolCompatibility(compatibility);
      await updateModel({
        model: model.id,
        provider: model.provider,
        capabilities: model.capabilities.map((c) => c.name),
      } as any);
    },
    [requestApproval, selectedModel.id, updateModel],
  );

  useEffect(() => {
    const checkApprovals = async () => {
      if (currentWorkflowId && pendingApprovals.length > 0 && getPendingApprovals) {
        const pending = await getPendingApprovals();
        setPendingApprovals(pending || []);
      }
    };
    const interval = setInterval(checkApprovals, 2000);
    return () => clearInterval(interval);
  }, [currentWorkflowId, pendingApprovals.length, getPendingApprovals]);

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            layout="size"
            className={`overflow-hidden rounded-lg px-3 py-2 transition-all duration-200 ${
              pendingApprovals.length > 0
                ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100'
                : 'hover:bg-accent'
            } disabled:opacity-50 relative`}
            transition={TRANSITION}
            disabled={isUpdating}
          >
            <motion.div layout="preserve-aspect" className="inline-flex items-center gap-2" transition={TRANSITION}>
              <span className="text-muted-foreground text-sm">Chat model</span>
              <TextMorph className="font-medium text-sm">{selectedModel.name}</TextMorph>
              {selectedModel.riskLevel === 'high' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
              <AnimatePresence>
                {isUpdating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full"
                    />
                  </motion.div>
                )}
                {pendingApprovals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs text-yellow-600">{pendingApprovals.length}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="shadow-lg min-w-[280px] max-h-[400px] overflow-y-auto">
          {pendingApprovals.length > 0 && (
            <div className="px-3 py-2 border-b">
              <div className="text-xs font-medium mb-1">Pending approvals</div>
              {pendingApprovals.map((req) => (
                <div key={req.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="text-xs truncate">
                    {req.toolName}: {req.parameters?.newModel || req.parameters?.command || ''}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      disabled={!approvalWorkflowId}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!approveRequest) return;
                        const ok = await approveRequest(req.id, true);
                        if (ok.ok) setPendingApprovals((prev) => prev.filter((p) => p.id !== req.id));
                      }}
                      className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200"
                    >
                      Approve
                    </button>
                    <button
                      disabled={!approvalWorkflowId}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!approveRequest) return;
                        const ok = await approveRequest(req.id, false);
                        if (ok.ok) setPendingApprovals((prev) => prev.filter((p) => p.id !== req.id));
                      }}
                      className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {modelGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">{group.label}</DropdownMenuLabel>
              {group.models.map((model) => {
                const Icon = model.icon;
                const isSelected = selectedModel.id === model.id;
                const compatibility = assessToolCompatibility(model);
                const compatibleCount = Object.values(compatibility).filter(Boolean).length;
                return (
                  <DropdownMenuItem key={model.id} onClick={() => handleModelSelect(model)} className="flex flex-col items-start gap-1 px-3 py-3 cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2 w-full">
                      {Icon && <Icon className="h-4 w-4" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {model.riskLevel === 'high' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                          {model.approvalRequired && <Clock className="h-3 w-3 text-primary" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{model.capabilities.map((c) => c.name).join(', ')}</div>
                        <div className="text-xs text-muted-foreground mt-1">Tools: {compatibleCount}/{getTotalToolCount()} compatible</div>
                      </div>
                      {isSelected && (
                        <motion.div layoutId="selected-indicator" className="h-2 w-2 bg-primary rounded-full" transition={TRANSITION} />
                      )}
                    </div>
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
