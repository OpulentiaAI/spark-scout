import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { getConversationQuery } from '@/temporal/workflows/chat-workflow';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 });
    }
    const client = await TemporalClientManager.getInstance();
    const handle = client.workflow.getHandle(workflowId);
    const conversation = await handle.query(getConversationQuery);
    return NextResponse.json({ conversation });
  } catch (err) {
    console.error('Temporal conversation error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}

