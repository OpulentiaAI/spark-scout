import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { approveActionSignal } from '@/temporal/workflows/approval-workflow';

export async function POST(req: NextRequest) {
  try {
    const { approvalWorkflowId, requestId, approved, feedback } = (await req.json()) as {
      approvalWorkflowId: string;
      requestId: string;
      approved: boolean;
      feedback?: string;
    };

    if (!approvalWorkflowId || !requestId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const client = await TemporalClientManager.getInstance();
    const handle = client.workflow.getHandle(approvalWorkflowId);
    await handle.signal(approveActionSignal, requestId, approved, feedback);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Temporal approvals approve error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501 });
  }
}

