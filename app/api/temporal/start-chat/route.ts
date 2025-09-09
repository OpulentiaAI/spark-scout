import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { taskQueues } from '@/temporal/config/temporal-config';
import type {
  ChatMessage,
  ModelConfig,
  ToolInvocation,
} from '@/temporal/types/workflow-types';
import { chatWorkflow } from '@/temporal/workflows';
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import { assertJsonContentType, verifySameOrigin, jsonError, noStoreHeaders } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const originCheck = verifySameOrigin(req);
    if (!originCheck.ok) return jsonError(403, 'Forbidden: origin not allowed');
    if (!assertJsonContentType(req)) return jsonError(415, 'Unsupported Media Type: application/json required');
    const { initialMessages, modelConfig, toolInvocations, workflowId } =
      (await req.json()) as {
        initialMessages?: ChatMessage[];
        modelConfig: ModelConfig;
        toolInvocations?: ToolInvocation[];
        workflowId?: string;
      };

    if (!modelConfig?.model || !modelConfig?.provider) {
      return NextResponse.json(
        { error: 'Missing modelConfig' },
        { status: 400 },
      );
    }

    const client = await TemporalClientManager.getInstance();

    const startPromise = client.workflow.start(chatWorkflow, {
      args: [initialMessages ?? [], modelConfig, toolInvocations ?? []],
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || taskQueues.CHAT_PROCESSING,
      workflowId: workflowId || `chat-${Date.now()}`,
    });

    const withDeadline = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
      let timeout: NodeJS.Timeout | null = null;
      try {
        return await Promise.race([
          p,
          new Promise<T>((_, reject) => {
            timeout = setTimeout(() => reject(new Error('DEADLINE_EXCEEDED')), ms);
          }),
        ]);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    };

    let handle;
    try {
      handle = await withDeadline(startPromise, 8000);
    } catch (err: any) {
      if (err instanceof WorkflowExecutionAlreadyStartedError) {
        return NextResponse.json({ error: 'Workflow already started', workflowId }, { status: 409, headers: noStoreHeaders() });
      }
      if (err && err.message === 'DEADLINE_EXCEEDED') {
        // Avoid unhandled rejections from the original promise
        void startPromise.catch(() => {});
        return NextResponse.json({ error: 'Start timeout' }, { status: 503, headers: noStoreHeaders() });
      }
      return NextResponse.json({ error: 'Temporal not available' }, { status: 501, headers: noStoreHeaders() });
    }

    return NextResponse.json({ workflowId: handle.workflowId }, { headers: noStoreHeaders() });
  } catch (err) {
    console.error('Temporal start-chat error', err);
    return NextResponse.json(
      { error: 'Temporal not available' },
      { status: 501, headers: noStoreHeaders() },
    );
  }
}
