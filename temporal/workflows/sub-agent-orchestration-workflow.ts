import { startChild, ParentClosePolicy, defineSignal, setHandler } from '@temporalio/workflow';
import { TemporalToolRegistry } from '../registry/TemporalToolRegistry';

export const deploySubAgentSignal = defineSignal<[string, string]>('deploySubAgent');

interface SubAgentTask {
  id: string;
  task: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

export async function subAgentOrchestrationWorkflow(
  primaryTask: string,
  subTasks: Array<{ task: string; description: string }>,
  maxConcurrentAgents: number = 3,
): Promise<any> {
  const registry = new TemporalToolRegistry();
  let subAgentTasks: SubAgentTask[] = subTasks.map((task, index) => ({
    id: `sub-agent-${index}`,
    task: task.task,
    description: task.description,
    status: 'pending',
  }));

  let dynamicTasks: SubAgentTask[] = [];

  setHandler(deploySubAgentSignal, (task: string, description: string) => {
    const newTask: SubAgentTask = {
      id: `dynamic-sub-agent-${Date.now()}`,
      task,
      description,
      status: 'pending',
    };
    dynamicTasks.push(newTask);
  });

  const allTasks: SubAgentTask[] = [...subAgentTasks, ...dynamicTasks];
  const runningAgents = new Map<string, Promise<any>>();
  const completedResults: Array<{ id: string; result: any }> = [];

  let taskIndex = 0;
  while (taskIndex < allTasks.length || runningAgents.size > 0) {
    while (runningAgents.size < maxConcurrentAgents && taskIndex < allTasks.length) {
      const task = allTasks[taskIndex];
      task.status = 'running';

      const agentPromise = startChild(readAgentWorkflow, {
        args: [task.task, task.description],
        workflowId: `${task.id}-${Date.now()}`,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
      });

      runningAgents.set(task.id, agentPromise);
      taskIndex++;

      await registry.executeTool('message_update', {
        message: `Started sub-agent ${task.id}. Running: ${runningAgents.size}`,
        status: 'Orchestrating sub-agents',
        status_emoji: '🤖',
      });
    }

    if (runningAgents.size > 0) {
      const completedPromises = Array.from(runningAgents.entries()).map(async ([id, promise]) => {
        try {
          const result = await promise;
          return { id, result, success: true } as const;
        } catch (error: any) {
          return { id, result: String(error?.message || error), success: false } as const;
        }
      });

      const firstCompleted = await Promise.race(completedPromises);

      const task = allTasks.find((t) => t.id === firstCompleted.id);
      if (task) {
        task.status = firstCompleted.success ? 'completed' : 'failed';
        task.result = firstCompleted.result;
      }

      runningAgents.delete(firstCompleted.id);
      completedResults.push({ id: firstCompleted.id, result: firstCompleted.result });

      await registry.executeTool('message_update', {
        message: `Sub-agent ${firstCompleted.id} completed. Progress: ${completedResults.length}/${allTasks.length}`,
        status: 'Processing sub-agent results',
        status_emoji: '📊',
      });
    }

    if (dynamicTasks.length > allTasks.length - subAgentTasks.length) {
      const newTasks = dynamicTasks.slice(allTasks.length - subAgentTasks.length);
      allTasks.push(...newTasks);
    }
  }

  const consolidatedReport = await consolidateSubAgentResults(completedResults, primaryTask);

  return {
    primaryTask,
    subAgentResults: completedResults,
    consolidatedReport,
    totalAgents: allTasks.length,
    successfulAgents: allTasks.filter((t) => t.status === 'completed').length,
    failedAgents: allTasks.filter((t) => t.status === 'failed').length,
  };
}

export async function readAgentWorkflow(task: string, description: string): Promise<any> {
  const registry = new TemporalToolRegistry();
  return await registry.executeTool('read_agent', { task, description });
}

async function consolidateSubAgentResults(
  results: Array<{ id: string; result: any }>,
  primaryTask: string,
): Promise<string> {
  const consolidatedFindings = results
    .map((r) => `Sub-agent ${r.id}: ${JSON.stringify(r.result)}`)
    .join('\n\n');
  return `Consolidated Report for: ${primaryTask}\n\n${consolidatedFindings}`;
}

