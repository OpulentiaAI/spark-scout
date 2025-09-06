import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { getCurrentModelQuery } from '@/temporal/workflows/chat-workflow';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 });
    }
    const client = await TemporalClientManager.getInstance();
    const handle = client.workflow.getHandle(workflowId);
    const model = await handle.query(getCurrentModelQuery);
    return NextResponse.json({ model });
  } catch (err) {
    console.error('Temporal current-model error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}

