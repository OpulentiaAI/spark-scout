import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { approvalWorkflow, requestApprovalSignal } from '@/temporal/workflows/approval-workflow';
import { taskQueues } from '@/temporal/config/temporal-config';

export async function POST(req: NextRequest) {
  try {
    const { approvalWorkflowId, request, autoApprovalRules } = (await req.json()) as {
      approvalWorkflowId?: string;
      request: any;
      autoApprovalRules?: Array<{ toolName: string; condition: (params: any) => boolean }>;
    };

    const client = await TemporalClientManager.getInstance();
    const id = approvalWorkflowId || `approvals-${Date.now()}`;

    let handle = client.workflow.getHandle(id);
    try {
      // Try to describe to check if it exists
      await handle.describe();
    } catch {
      handle = await client.workflow.start(approvalWorkflow, {
        args: [autoApprovalRules ?? []],
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || taskQueues.CHAT_PROCESSING,
        workflowId: id,
      });
    }

    await handle.signal(requestApprovalSignal, request);
    return NextResponse.json({ ok: true, approvalWorkflowId: id });
  } catch (err) {
    console.error('Temporal approvals request error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}
