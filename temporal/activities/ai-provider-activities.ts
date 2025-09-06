import { Context } from '@temporalio/activity';
import type { ChatMessage, ModelConfig, ToolInvocation } from '../types/workflow-types';

export async function generateChatResponse(
  conversation: ChatMessage[],
  modelConfig: ModelConfig
): Promise<string> {
  const context = Context.current();
  context.log.info('Generating chat response', { model: modelConfig.model });

  // TODO: Integrate with existing AI provider selection logic in this repo.
  // For now, return a placeholder string so workflows remain executable in dev.
  context.heartbeat();
  return `Response from ${modelConfig.provider}/${modelConfig.model}`;
}

export async function invokeTool(toolInvocation: ToolInvocation): Promise<string> {
  const context = Context.current();
  context.log.info('Invoking tool', { tool: toolInvocation.name });
  // TODO: Bridge to lib/ai/tools/* where available.
  context.heartbeat();
  return `Executed tool ${toolInvocation.name}`;
}

export async function saveToDatabase(
  conversation: ChatMessage[],
  modelConfig: ModelConfig
): Promise<void> {
  // TODO: Wire into Drizzle/DB persistence once available
}

export function createActivities(_dependencies: {
  aiClient?: any;
  database?: any;
  toolRegistry?: any;
}) {
  return {
    generateChatResponse: (conversation: ChatMessage[], modelConfig: ModelConfig) =>
      generateChatResponse(conversation, modelConfig),
    invokeTool: (toolInvocation: ToolInvocation) => invokeTool(toolInvocation),
    saveToDatabase: (conversation: ChatMessage[], modelConfig: ModelConfig) =>
      saveToDatabase(conversation, modelConfig),
  };
}

