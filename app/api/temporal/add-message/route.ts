import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { addMessageSignal } from '@/temporal/workflows/chat-workflow';
import type { ChatMessage } from '@/temporal/types/workflow-types';

export async function POST(req: NextRequest) {
  try {
    const { workflowId, message } = (await req.json()) as {
      workflowId: string;
      message: ChatMessage;
    };
    if (!workflowId || !message?.role || typeof message.content !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const client = await TemporalClientManager.getInstance();
    const handle = client.workflow.getHandle(workflowId);
    await handle.signal(addMessageSignal, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Temporal add-message error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}

