import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { fileURLToPath } from 'node:url';
import { toolChainWorkflow, approveToolSignal } from '../workflows/tool-chain-workflow';
import { executeCapyTool } from '../activities/capy-tool-activities';

describe.skip('Capy Tool Integration (Temporal)', () => {
  let testEnv: TestWorkflowEnvironment;
  let worker: Worker;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    const workflowsPath = fileURLToPath(new URL('../workflows', import.meta.url));
    worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-capy-tools',
      workflowsPath,
      activities: { executeCapyTool },
    });
  });

  afterAll(async () => {
    await worker?.shutdown();
    await testEnv?.teardown();
  });

  it('executes file operation tool chain', async () => {
    await worker.runUntil(async () => {
      const toolChain = [
        { name: 'ls', params: { path: '/project/workspace' } },
        { name: 'read', params: { file_path: '/project/workspace/package.json' } },
        { name: 'edit', params: { file_path: '/project/workspace/test.txt', edits: [{ old_string: 'old', new_string: 'new' }] } },
      ];

      const result = await testEnv.client.workflow.execute(toolChainWorkflow, {
        workflowId: 'test-file-chain',
        taskQueue: 'test-capy-tools',
        args: [{ task: 'File operations test' }, toolChain, 50000],
      });

      expect(result.completedTools).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.handoffTriggered).toBeFalsy();
    });
  });

  it('handles approval-required tools', async () => {
    await worker.runUntil(async () => {
      const toolChain = [
        { name: 'bash_run', params: { command: 'echo "test"', description: 'Test command', timeout: 10 } },
      ];

      const handle = await testEnv.client.workflow.start(toolChainWorkflow, {
        workflowId: 'test-approval-chain',
        taskQueue: 'test-capy-tools',
        args: [{ task: 'Approval test' }, toolChain, 50000],
      });

      await testEnv.sleep('1s');
      await handle.signal(approveToolSignal, 'bash_run', true);
      const result = await handle.result();
      expect(result.completedTools).toBe(1);
    });
  });

  it('triggers handoff at token limit', async () => {
    await worker.runUntil(async () => {
      const toolChain = Array.from({ length: 50 }).map((_, i) => ({ name: 'web_search', params: { query: `test query ${i}` } }));

      const result = await testEnv.client.workflow.execute(toolChainWorkflow, {
        workflowId: 'test-handoff-chain',
        taskQueue: 'test-capy-tools',
        args: [{ task: 'Token limit test' }, toolChain, 1000],
      });

      expect(result.handoffTriggered).toBeTruthy();
      expect(result.remainingTools.length).toBeGreaterThan(0);
    });
  });
});
