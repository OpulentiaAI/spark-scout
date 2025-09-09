import { NextResponse, type NextRequest } from 'next/server';
import { TemporalClientManager } from '@/temporal/client/temporal-client';
import { getConversationQuery } from '@/temporal/workflows/chat-workflow';
import { WorkflowNotFoundError, QueryRejectedError } from '@temporalio/client';
import { noStoreHeaders } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400, headers: noStoreHeaders() });
    }
    const client = await TemporalClientManager.getInstance();
    const handle = client.workflow.getHandle(workflowId);
    // Apply a short deadline for responsiveness; map errors clearly
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

    const queryPromise = handle.query(getConversationQuery);
    try {
      const conversation = await withDeadline(queryPromise, 5000);
      return NextResponse.json({ conversation }, { headers: noStoreHeaders() });
    } catch (err: any) {
      if (err instanceof WorkflowNotFoundError) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404, headers: noStoreHeaders() });
      }
      if (err instanceof QueryRejectedError) {
        // Typically means workflow not open/running
        return NextResponse.json({ error: 'Workflow not running' }, { status: 503, headers: noStoreHeaders() });
      }
      if (err && err.message === 'DEADLINE_EXCEEDED') {
        // Avoid unhandled rejections from the original query
        void queryPromise.catch(() => {});
        return NextResponse.json({ error: 'Query timeout' }, { status: 503, headers: noStoreHeaders() });
      }
      return NextResponse.json({ error: 'Temporal not available' }, { status: 501, headers: noStoreHeaders() });
    }
  } catch (err) {
    console.error('Temporal conversation error', err);
    return NextResponse.json({ error: 'Temporal not available' }, { status: 501, headers: noStoreHeaders() });
  }
}
