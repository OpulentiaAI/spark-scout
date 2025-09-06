import { proxyActivities, defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';
import { TemporalToolRegistry } from '../registry/TemporalToolRegistry';

export const addToolToChainSignal = defineSignal<[string, any]>('addToolToChain');
export const approveToolSignal = defineSignal<[string, boolean]>('approveTool');
export const updateContextSignal = defineSignal<[any]>('updateContext');

export const getToolChainQuery = defineQuery<any[]>('getToolChain');
export const getCurrentContextQuery = defineQuery<any>('getCurrentContext');
export const getPendingApprovalsQuery = defineQuery<string[]>('getPendingApprovals');

interface ContextState {
  tokenCount: number;
  currentTask: string;
  userSession: any;
  fileModifications: string[];
  toolResults: Map<string, any>;
  approvalQueue: string[];
}

export async function toolChainWorkflow(
  initialContext: any,
  toolChain: Array<{ name: string; params: any }>,
  maxTokens: number = 100000,
): Promise<any> {
  const registry = new TemporalToolRegistry();
  let context: ContextState = {
    tokenCount: 0,
    currentTask: initialContext.task || 'Processing tool chain',
    userSession: initialContext.session,
    fileModifications: [],
    toolResults: new Map(),
    approvalQueue: [],
  };

  let dynamicToolChain = [...toolChain];
  const results: any[] = [];
  let pendingApprovals: string[] = [];

  setHandler(addToolToChainSignal, (toolName: string, params: any) => {
    dynamicToolChain.push({ name: toolName, params });
  });

  setHandler(approveToolSignal, (toolId: string, approved: boolean) => {
    const index = pendingApprovals.indexOf(toolId);
    if (index > -1) {
      pendingApprovals.splice(index, 1);
      if (!approved) {
        const toolIndex = dynamicToolChain.findIndex((t) => t.name === toolId);
        if (toolIndex > -1) dynamicToolChain.splice(toolIndex, 1);
      }
    }
  });

  setHandler(updateContextSignal, (newContext: any) => {
    context = { ...context, ...newContext };
  });

  setHandler(getToolChainQuery, () => dynamicToolChain);
  setHandler(getCurrentContextQuery, () => context);
  setHandler(getPendingApprovalsQuery, () => pendingApprovals);

  for (let i = 0; i < dynamicToolChain.length; i++) {
    const tool = dynamicToolChain[i];
    const toolConfig = registry.getAllTools().find((t) => t.name === tool.name);

    if (toolConfig?.requiresApproval) {
      pendingApprovals.push(tool.name);
      await condition(() => !pendingApprovals.includes(tool.name));
      if (!dynamicToolChain.find((t) => t.name === tool.name)) continue;
    }

    if (context.tokenCount > maxTokens * 0.8) {
      const handoffResult = await registry.executeTool('handoff', {
        primary_request: context.currentTask,
        reason: 'Approaching token limit',
        key_topics: `Executed ${i} tools in chain`,
        files_and_resources: context.fileModifications.join('\n'),
        problem_solving: `Tool chain execution in progress`,
        current_task: `Executing tool: ${tool.name}`,
        next_step: `Continue with remaining ${dynamicToolChain.length - i} tools`,
        errors_and_fixes: undefined,
      });

      return {
        handoffTriggered: true,
        completedTools: results.length,
        remainingTools: dynamicToolChain.slice(i),
        context,
      };
    }

    try {
      const result = await registry.executeTool(tool.name, tool.params, context);
      results.push({ tool: tool.name, result });
      context.toolResults.set(tool.name, result);
      context.tokenCount += estimateTokenUsage(tool.name, tool.params, result);
      if (['edit', 'multi_edit', 'write'].includes(tool.name)) {
        context.fileModifications.push(tool.params.file_path || tool.params.path);
      }
    } catch (error: any) {
      if (tool.name === 'bash_run' && String(error?.message || '').includes('timeout')) {
        const checkResult = await registry.executeTool('bash_command_check', { command_id: 'cmd-123' });
        results.push({ tool: `${tool.name}_check`, result: checkResult });
      } else {
        results.push({ tool: tool.name, error: String(error?.message || error) });
      }
    }

    await registry.executeTool('message_update', {
      message: `Completed ${tool.name}. Progress: ${i + 1}/${dynamicToolChain.length}`,
      status: 'Processing tool chain',
      status_emoji: '⚙️',
    });
  }

  return {
    results,
    context,
    completedTools: results.length,
    finalTokenCount: context.tokenCount,
    handoffTriggered: false,
  };
}

function estimateTokenUsage(toolName: string, _params: any, result: any): number {
  const baseTokens: Record<string, number> = {
    read: 100,
    edit: 50,
    web_search: 200,
    image_generate: 300,
    bash_run: 150,
    lsp: 100,
  };
  const base = baseTokens[toolName] || 100;
  let size = 0;
  try {
    size = JSON.stringify(result).length / 4;
  } catch {
    size = 100;
  }
  return base + size;
}
