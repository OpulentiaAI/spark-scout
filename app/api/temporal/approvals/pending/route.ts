import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { getPendingApprovalsQuery } from '@/temporal/workflows/approval-workflow';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('approvalWorkflowId');
    if (!id) return NextResponse.json({ error: 'Missing approvalWorkflowId' }, { status: 400 });

    const client = await TemporalClientManager.getInstance();
    const handle = client.workflow.getHandle(id);
    const pending = await handle.query(getPendingApprovalsQuery);
    return NextResponse.json({ pending });
  } catch (err) {
    console.error('Temporal approvals pending error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}

