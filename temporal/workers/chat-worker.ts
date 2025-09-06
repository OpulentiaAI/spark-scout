import { Worker } from '@temporalio/worker';
import { createActivities } from '../activities/ai-provider-activities';
import * as toolActivities from '../activities/tool-activities';
import { executeCapyTool } from '../activities/capy-tool-activities';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export async function createChatWorker() {
  const activities = {
    ...createActivities({}),
    ...toolActivities,
    executeCapyTool,
  } as const;

  return await Worker.create({
    workflowsPath: require.resolve('../workflows'),
    activities,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'chat-processing',
  });
}

// Allow running directly: bun run tsx temporal/workers/chat-worker.ts
if (require.main === module) {
  (async () => {
    const worker = await createChatWorker();
    console.log('Chat Worker starting...');
    await worker.run();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
