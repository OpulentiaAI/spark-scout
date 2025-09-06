import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { chatWorkflow } from '../workflows/chat-workflow';
import { fileURLToPath } from 'node:url';
import { createActivities } from '../activities/ai-provider-activities';

describe('Chat Workflow', () => {
  let testEnv: TestWorkflowEnvironment;
  let worker: Worker;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    const workflowsPath = fileURLToPath(new URL('../workflows', import.meta.url));
    worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-chat',
      workflowsPath,
      activities: { ...createActivities({}) },
    });
  });

  afterAll(async () => {
    try {
      await worker?.shutdown();
    } catch {/* ignore */}
    await testEnv?.teardown();
  });

  it('returns basic response', async () => {
    await worker.runUntil(async () => {
      const result = await testEnv.client.workflow.execute(chatWorkflow, {
        workflowId: 'test-chat-basic',
        taskQueue: 'test-chat',
        args: [
          [
            { role: 'user', content: 'Hello', timestamp: Date.now() },
          ],
          { provider: 'OpenAI', model: 'gpt-4o-mini' },
          [],
        ],
      });

      expect(result).toContain('Response from OpenAI/gpt-4o-mini');
    });
  });
});
