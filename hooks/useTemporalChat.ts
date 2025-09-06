'use client';

import { useState, useCallback } from 'react';
import type { ModelConfig, ChatMessage } from '@/temporal/types/workflow-types';

export function useTemporalChat() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [approvalWorkflowId, setApprovalWorkflowId] = useState<string | null>(null);

  const updateModel = useCallback(
    async (modelConfig: ModelConfig) => {
      setIsUpdating(true);
      try {
        // Keep existing UX: store cookie for selected model
        await fetch('/api/chat-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelConfig.model }),
        });

        if (currentWorkflowId) {
          await fetch('/api/temporal/update-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflowId: currentWorkflowId, model: modelConfig }),
          });
        }
      } catch (error) {
        console.error('Failed to update model:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [currentWorkflowId],
  );

  const addMessage = useCallback(
    async (message: ChatMessage) => {
      if (!currentWorkflowId) return;
      try {
        await fetch('/api/temporal/add-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId: currentWorkflowId, message }),
        });
      } catch (err) {
        console.error('Failed to add message', err);
      }
    },
    [currentWorkflowId],
  );

  const getCurrentModel = useCallback(async (): Promise<ModelConfig | null> => {
    try {
      if (!currentWorkflowId) return null;
      const res = await fetch(`/api/temporal/current-model?workflowId=${currentWorkflowId}`);
      const data = (await res.json()) as { model?: ModelConfig };
      return data.model || null;
    } catch (err) {
      console.error('Failed to get current model', err);
      return null;
    }
  }, [currentWorkflowId]);

  return {
    // Optional: start a chat workflow and persist its ID
    startChat: async (
      modelConfig: ModelConfig,
      initialMessages: ChatMessage[] = [],
    ) => {
      try {
        const res = await fetch('/api/temporal/start-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelConfig, initialMessages }),
        });
        const data = (await res.json()) as { workflowId?: string };
        if (data.workflowId) setCurrentWorkflowId(data.workflowId);
        return data.workflowId || null;
      } catch (err) {
        console.error('Failed to start chat workflow', err);
        return null;
      }
    },
    updateModel,
    addMessage,
    getCurrentModel,
    isUpdating,
    currentWorkflowId,
    setCurrentWorkflowId,
    approvalWorkflowId,
    // Phase 8: approval workflow hooks via API
    requestApproval: async (request: any) => {
      try {
        const res = await fetch('/api/temporal/approvals/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approvalWorkflowId,
            request,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; approvalWorkflowId?: string };
        if (data.approvalWorkflowId) setApprovalWorkflowId(data.approvalWorkflowId);
        return { ok: !!data.ok, approvalWorkflowId: data.approvalWorkflowId };
      } catch (err) {
        console.error('Failed to request approval', err);
        return { ok: false };
      }
    },
    getPendingApprovals: async () => {
      try {
        if (!approvalWorkflowId) return [] as any[];
        const res = await fetch(`/api/temporal/approvals/pending?approvalWorkflowId=${approvalWorkflowId}`);
        const data = (await res.json()) as { pending?: any[] };
        return data.pending || [];
      } catch (err) {
        console.error('Failed to fetch pending approvals', err);
        return [] as any[];
      }
    },
    approveRequest: async (requestId: string, approved: boolean, feedback?: string) => {
      try {
        if (!approvalWorkflowId) return { ok: false };
        const res = await fetch('/api/temporal/approvals/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvalWorkflowId, requestId, approved, feedback }),
        });
        const data = (await res.json()) as { ok?: boolean };
        return { ok: !!data.ok };
      } catch (err) {
        console.error('Failed to approve request', err);
        return { ok: false };
      }
    },
  };
}
