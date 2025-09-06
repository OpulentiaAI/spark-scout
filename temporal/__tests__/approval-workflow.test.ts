import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { approvalWorkflow, requestApprovalSignal, approveActionSignal, getPendingApprovalsQuery, getApprovalHistoryQuery } from '../workflows/approval-workflow';
import { fileURLToPath } from 'node:url';
import { executeCapyTool } from '../activities/capy-tool-activities';

describe.skip('Approval Workflow', () => {
  let testEnv: TestWorkflowEnvironment;
  let worker: Worker;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    const workflowsPath = fileURLToPath(new URL('../workflows', import.meta.url));
    worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-approvals',
      workflowsPath,
      activities: { executeCapyTool },
    });
  });

  afterAll(async () => {
    try {
      await worker?.shutdown();
    } catch {/* ignore */}
    await testEnv?.teardown();
  });

  it('queues and approves requests', async () => {
    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(approvalWorkflow, {
        workflowId: 'approvals-basic',
        taskQueue: 'test-approvals',
        args: [[]],
      });

      const reqId = `req-${Date.now()}`;
      await handle.signal(requestApprovalSignal, {
        id: reqId,
        toolName: 'bash_run',
        parameters: { command: 'echo test' },
        reasoning: 'Test approval',
        riskLevel: 'medium',
        timestamp: Date.now(),
        timeout: 60,
      });
      let found = false;
      for (let i = 0; i < 5; i++) {
        await testEnv.sleep('1s');
        const pending = await handle.query(getPendingApprovalsQuery);
        if (pending.some((r) => r.id === reqId)) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);

      await handle.signal(approveActionSignal, reqId, true);
      let removed = false;
      for (let i = 0; i < 5; i++) {
        await testEnv.sleep('1s');
        const pendingAfter = await handle.query(getPendingApprovalsQuery);
        if (!pendingAfter.some((r) => r.id === reqId)) {
          removed = true;
          break;
        }
      }
      expect(removed).toBe(true);
      const history = await handle.query(getApprovalHistoryQuery);
      expect(history.some((r) => r.request.id === reqId && r.approved)).toBe(true);
    });
  });
});
