import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
} from '@temporalio/workflow';
import type * as activities from '../activities/ai-provider-activities';
import type {
  ChatMessage,
  ModelConfig,
  ToolInvocation,
} from '../types/workflow-types';

const { generateChatResponse, invokeTool, saveToDatabase } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '500ms',
    maximumInterval: '5s',
    maximumAttempts: 2,
  },
});

export const updateModelSignal = defineSignal<[ModelConfig]>('updateModel');
export const addMessageSignal = defineSignal<[ChatMessage]>('addMessage');

export const getConversationQuery =
  defineQuery<ChatMessage[]>('getConversation');
export const getCurrentModelQuery = defineQuery<ModelConfig>('getCurrentModel');

export async function chatWorkflow(
  initialMessages: ChatMessage[],
  modelConfig: ModelConfig,
  toolInvocations: ToolInvocation[],
): Promise<string> {
  let conversation = [...initialMessages];
  let currentModel = modelConfig;
  let tools = toolInvocations;

  setHandler(updateModelSignal, (newModel) => {
    currentModel = newModel;
  });

  setHandler(addMessageSignal, (message) => {
    conversation.push(message);
  });

  setHandler(getConversationQuery, () => conversation);
  setHandler(getCurrentModelQuery, () => currentModel);

  const response = await generateChatResponse(conversation, currentModel);

  if (tools.length > 0) {
    for (const tool of tools) {
      const toolResult = await invokeTool(tool);
      conversation.push({
        role: 'tool',
        content: toolResult,
        timestamp: Date.now(),
      });
    }
  }

  await saveToDatabase(conversation, currentModel);
  return response;
}
