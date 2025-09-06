import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { chatWorkflow, updateModelSignal, addMessageSignal, getCurrentModelQuery, getConversationQuery } from '../workflows/chat-workflow';
import { fileURLToPath } from 'node:url';
import { createActivities } from '../activities/ai-provider-activities';

describe('Chat Workflow signals/queries', () => {
  let testEnv: TestWorkflowEnvironment;
  let worker: Worker;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    const workflowsPath = fileURLToPath(new URL('../workflows', import.meta.url));
    worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-chat-signals',
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

  it('updates model and conversation via signals', async () => {
    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(chatWorkflow, {
        workflowId: 'chat-signal-queries',
        taskQueue: 'test-chat-signals',
        args: [
          [],
          { provider: 'OpenAI', model: 'gpt-4o-mini' },
          [],
        ],
      });

      // Update model
      await handle.signal(updateModelSignal, { provider: 'Anthropic', model: 'claude-3-5-sonnet' });
      const model = await handle.query(getCurrentModelQuery);
      expect(model.provider).toBe('Anthropic');

      // Add message
      await handle.signal(addMessageSignal, { role: 'user', content: 'Hi', timestamp: Date.now() });
      const conv = await handle.query(getConversationQuery);
      expect(conv.length).toBe(1);
      expect(conv[0].content).toBe('Hi');

      // Finish
      const result = await handle.result();
      expect(result).toContain('Response');
    });
  });
});
