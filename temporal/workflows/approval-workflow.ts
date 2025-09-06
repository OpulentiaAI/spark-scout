import { defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';
import { TemporalToolRegistry } from '../registry/TemporalToolRegistry';

export const approveActionSignal = defineSignal<[string, boolean, string?]>('approveAction');
export const requestApprovalSignal = defineSignal<[ApprovalRequest]>('requestApproval');

export const getPendingApprovalsQuery = defineQuery<ApprovalRequest[]>('getPendingApprovals');
export const getApprovalHistoryQuery = defineQuery<ApprovalRecord[]>('getApprovalHistory');

interface ApprovalRequest {
  id: string;
  toolName: string;
  parameters: any;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: number;
  timeout?: number; // seconds
}

interface ApprovalRecord {
  request: ApprovalRequest;
  approved: boolean;
  userFeedback?: string;
  approvedAt: number;
  autoApproved?: boolean;
}

export async function approvalWorkflow(
  autoApprovalRules: Array<{ toolName: string; condition: (params: any) => boolean }> = [],
): Promise<void> {
  const registry = new TemporalToolRegistry();
  let pendingApprovals: ApprovalRequest[] = [];
  let approvalHistory: ApprovalRecord[] = [];

  setHandler(requestApprovalSignal, (request: ApprovalRequest) => {
    const autoRule = autoApprovalRules.find(
      (rule) => rule.toolName === request.toolName && rule.condition(request.parameters),
    );
    if (autoRule) {
      const record: ApprovalRecord = {
        request,
        approved: true,
        approvedAt: Date.now(),
        autoApproved: true,
      };
      approvalHistory.push(record);
    } else {
      pendingApprovals.push(request);
      registry.executeTool('message_update', {
        message: `Approval required for ${request.toolName}. Risk: ${request.riskLevel}`,
        status: 'Waiting for user approval',
        status_emoji: '⏳',
      });
    }
  });

  setHandler(approveActionSignal, (requestId: string, approved: boolean, feedback?: string) => {
    const requestIndex = pendingApprovals.findIndex((r) => r.id === requestId);
    if (requestIndex > -1) {
      const request = pendingApprovals[requestIndex];
      pendingApprovals.splice(requestIndex, 1);
      const record: ApprovalRecord = {
        request,
        approved,
        userFeedback: feedback,
        approvedAt: Date.now(),
        autoApproved: false,
      };
      approvalHistory.push(record);
    }
  });

  setHandler(getPendingApprovalsQuery, () => pendingApprovals);
  setHandler(getApprovalHistoryQuery, () => approvalHistory);

  while (true) {
    const now = Date.now();
    const timedOut = pendingApprovals.filter(
      (request) => request.timeout && now - request.timestamp > request.timeout * 1000,
    );
    for (const request of timedOut) {
      const record: ApprovalRecord = {
        request,
        approved: request.riskLevel === 'low',
        approvedAt: now,
        userFeedback: 'Timed out - auto-processed based on risk level',
        autoApproved: true,
      };
      approvalHistory.push(record);
      const index = pendingApprovals.indexOf(request);
      if (index > -1) pendingApprovals.splice(index, 1);
    }
    await condition(() => pendingApprovals.length > 0 || approvalHistory.length > 0, '30s');
  }
}

export function assessRiskLevel(toolName: string, parameters: any): 'low' | 'medium' | 'high' {
  const highRiskTools = ['bash_run', 'edit', 'multi_edit', 'write'];
  const mediumRiskTools = ['image_generate', 'web_download', 'computer'];
  if (highRiskTools.includes(toolName)) {
    if (toolName === 'bash_run' && parameters.command?.includes('rm ')) return 'high';
    return 'medium';
  }
  if (mediumRiskTools.includes(toolName)) return 'medium';
  return 'low';
}

