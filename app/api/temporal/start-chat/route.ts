import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { taskQueues } from '@/temporal/config/temporal-config';
import type { ChatMessage, ModelConfig, ToolInvocation } from '@/temporal/types/workflow-types';
import { chatWorkflow } from '@/temporal/workflows';

export async function POST(req: NextRequest) {
  try {
    const { initialMessages, modelConfig, toolInvocations, workflowId } = (await req.json()) as {
      initialMessages?: ChatMessage[];
      modelConfig: ModelConfig;
      toolInvocations?: ToolInvocation[];
      workflowId?: string;
    };

    if (!modelConfig?.model || !modelConfig?.provider) {
      return NextResponse.json({ error: 'Missing modelConfig' }, { status: 400 });
    }

    const client = await TemporalClientManager.getInstance();

    const handle = await client.workflow.start(chatWorkflow, {
      args: [initialMessages ?? [], modelConfig, toolInvocations ?? []],
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || taskQueues.CHAT_PROCESSING,
      workflowId: workflowId || `chat-${Date.now()}`,
    });

    return NextResponse.json({ workflowId: handle.workflowId });
  } catch (err) {
    console.error('Temporal start-chat error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}
