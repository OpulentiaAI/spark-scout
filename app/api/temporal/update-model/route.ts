import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import type { ModelConfig } from '@/temporal/types/workflow-types';
import { updateModelSignal } from '@/temporal/workflows/chat-workflow';

export async function POST(req: NextRequest) {
  try {
    const { workflowId, model } = (await req.json()) as {
      workflowId: string;
      model: ModelConfig;
    };

    if (!workflowId || !model?.model) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // If Temporal packages are not installed in this environment, fail gracefully
    const client = await TemporalClientManager.getInstance();
    const handle = client.workflow.getHandle(workflowId);
    await handle.signal(updateModelSignal, model);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Temporal update-model error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}

