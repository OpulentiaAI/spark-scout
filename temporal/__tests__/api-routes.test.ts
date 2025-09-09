import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

// Mock the Temporal client manager used by the routes
vi.mock('@/temporal/client/temporal-client', () => {
  return {
    TemporalClientManager: {
      getInstance: vi.fn(),
    },
  };
});

// Utilities
function makeJsonRequest(url: string, body: any) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: new URL(url).origin,
    },
    body: JSON.stringify(body),
  });
}

describe('Temporal API routes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('conversation GET returns 400 when workflowId missing', async () => {
    const { GET } = await import('../../app/api/temporal/conversation/route');
    const req = new Request(
      'https://example.test/api/temporal/conversation',
    ) as any;
    const res = (await GET(req)) as Response;
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Missing workflowId/);
  });

  it('conversation GET maps WorkflowNotFoundError to 404', async () => {
    const { TemporalClientManager } = await import(
      '@/temporal/client/temporal-client'
    );
    const { WorkflowNotFoundError } = await import('@temporalio/common');

    (TemporalClientManager.getInstance as any).mockResolvedValue({
      workflow: {
        getHandle: (id: string) => ({
          query: () =>
            Promise.reject(
              new WorkflowNotFoundError('not found', id, undefined),
            ),
        }),
      },
    });

    const { GET } = await import('../../app/api/temporal/conversation/route');
    const req = new Request(
      'https://example.test/api/temporal/conversation?workflowId=abc',
    ) as any;
    const res = (await GET(req)) as Response;
    expect(res.status).toBe(404);
  });

  it('conversation GET maps QueryRejectedError to 503', async () => {
    const { TemporalClientManager } = await import(
      '@/temporal/client/temporal-client'
    );
    const { QueryRejectedError } = await import('@temporalio/client');

    (TemporalClientManager.getInstance as any).mockResolvedValue({
      workflow: {
        getHandle: () => ({
          query: () => Promise.reject(new QueryRejectedError(0 as any)),
        }),
      },
    });

    const { GET } = await import('../../app/api/temporal/conversation/route');
    const req = new Request(
      'https://example.test/api/temporal/conversation?workflowId=abc',
    ) as any;
    const res = (await GET(req)) as Response;
    expect(res.status).toBe(503);
  });

  it('start-chat POST maps WorkflowExecutionAlreadyStartedError to 409', async () => {
    const { TemporalClientManager } = await import(
      '@/temporal/client/temporal-client'
    );
    const { WorkflowExecutionAlreadyStartedError } = await import(
      '@temporalio/common'
    );

    (TemporalClientManager.getInstance as any).mockResolvedValue({
      workflow: {
        start: () =>
          Promise.reject(
            new WorkflowExecutionAlreadyStartedError(
              'already',
              'chat-1',
              'chatWorkflow',
            ),
          ),
      },
    });

    const { POST } = await import('../../app/api/temporal/start-chat/route');
    const req = makeJsonRequest(
      'https://example.test/api/temporal/start-chat',
      {
        initialMessages: [],
        modelConfig: { provider: 'OpenAI', model: 'gpt-4o' },
        workflowId: 'chat-1',
      },
    );
    const res = (await POST(req as any)) as Response;
    expect(res.status).toBe(409);
  });
});
