import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/tool-activities';

const { executeWebSearch, generateImage, analyzeDocument, executeCode } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '15 minutes',
    retry: {
      initialInterval: '2s',
      maximumInterval: '1m',
      maximumAttempts: 3,
    },
  });

export async function toolInvocationWorkflow(
  toolName: string,
  parameters: Record<string, any>,
): Promise<any> {
  switch (toolName) {
    case 'web_search':
      return await executeWebSearch(parameters);
    case 'image_generation':
      return await generateImage(parameters);
    case 'document_analysis':
      return await analyzeDocument(parameters);
    case 'code_execution':
      return await executeCode(parameters as any);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
