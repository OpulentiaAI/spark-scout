import { condition, defineSignal, defineQuery, setHandler } from '@temporalio/workflow';
import { TemporalToolRegistry } from '../registry/TemporalToolRegistry';

export const contextWarningSignal = defineSignal<[number]>('contextWarning');
export const forceHandoffSignal = defineSignal<[]>('forceHandoff');

export const getContextStatusQuery = defineQuery<{
  tokenCount: number;
  warningThreshold: number;
  forcedThreshold: number;
  status: 'normal' | 'warning' | 'critical';
}>('getContextStatus');

interface ContextManagerState {
  tokenCount: number;
  warningThreshold: number;
  forcedThreshold: number;
  fileModifications: string[];
  keyDecisions: string[];
  currentPhase: string;
  errors: Array<{ error: string; fix: string; timestamp: number }>;
}

export async function contextManagementWorkflow(
  initialContext: any,
  warningThreshold: number = 100000,
  forcedThreshold: number = 120000,
): Promise<any> {
  const registry = new TemporalToolRegistry();
  let context: ContextManagerState = {
    tokenCount: 0,
    warningThreshold,
    forcedThreshold,
    fileModifications: [],
    keyDecisions: [],
    currentPhase: initialContext.phase || 'initialization',
    errors: [],
  };

  let handoffRequested = false;
  let forceHandoff = false;

  setHandler(contextWarningSignal, (newTokenCount: number) => {
    context.tokenCount = newTokenCount;
    if (context.tokenCount >= context.warningThreshold) handoffRequested = true;
  });

  setHandler(forceHandoffSignal, () => {
    forceHandoff = true;
  });

  setHandler(getContextStatusQuery, () => ({
    tokenCount: context.tokenCount,
    warningThreshold: context.warningThreshold,
    forcedThreshold: context.forcedThreshold,
    status:
      context.tokenCount >= context.forcedThreshold
        ? 'critical'
        : context.tokenCount >= context.warningThreshold
          ? 'warning'
          : 'normal',
  }));

  while (!handoffRequested && !forceHandoff) {
    if (context.tokenCount >= context.forcedThreshold) {
      forceHandoff = true;
      break;
    }
    await condition(() => handoffRequested || forceHandoff, '1m');
    if (handoffRequested || forceHandoff) break;
  }

  const handoffReason = forceHandoff
    ? 'Forced handoff - reached token limit'
    : 'Proactive handoff - approaching token limit';

  const handoffData = {
    primary_request: initialContext.primaryRequest || 'Continue processing',
    reason: handoffReason,
    key_topics: context.keyDecisions.map((d) => `• ${d}`).join('\n'),
    files_and_resources: context.fileModifications
      .map((f) => `• ${f}: Modified during ${context.currentPhase}`)
      .join('\n'),
    problem_solving: context.keyDecisions.join('\n'),
    current_task: context.currentPhase,
    next_step: 'Continue with fresh context maintaining all state',
    errors_and_fixes: context.errors
      .map((e) => `${new Date(e.timestamp).toISOString()}: ${e.error} → ${e.fix}`)
      .join('\n'),
  };

  await registry.executeTool('handoff', handoffData);

  return {
    handoffExecuted: true,
    finalTokenCount: context.tokenCount,
    handoffReason,
    preservedState: {
      fileModifications: context.fileModifications,
      keyDecisions: context.keyDecisions,
      errors: context.errors,
    },
  };
}

