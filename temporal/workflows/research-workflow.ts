import { startChild, ParentClosePolicy } from '@temporalio/workflow';
import { toolInvocationWorkflow } from './tool-invocation-workflow';

function extractFollowUpQueries(_searchResults: any, _analysisResults: any): string[] {
  // TODO: Derive follow-up queries based on results
  return [];
}

export async function deepResearchWorkflow(
  query: string,
  maxDepth: number = 3,
  currentDepth: number = 0,
): Promise<any> {
  if (currentDepth >= maxDepth) {
    return { query, depth: currentDepth, results: [] };
  }

  const searchPromise = startChild(toolInvocationWorkflow, {
    args: ['web_search', { q: query }],
    workflowId: `search-${query}-${currentDepth}-${Date.now()}`,
    parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
  });

  const analysisPromise = startChild(toolInvocationWorkflow, {
    args: ['document_analysis', { query }],
    workflowId: `analysis-${query}-${currentDepth}-${Date.now()}`,
    parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
  });

  const [searchResults, analysisResults] = await Promise.all([
    searchPromise,
    analysisPromise,
  ]);

  const followUpQueries = extractFollowUpQueries(searchResults, analysisResults);
  const deeperResults = await Promise.all(
    followUpQueries.map((followUpQuery) =>
      startChild(deepResearchWorkflow, {
        args: [followUpQuery, maxDepth, currentDepth + 1],
        workflowId: `deep-research-${followUpQuery}-${Date.now()}`,
      }),
    ),
  );

  return {
    query,
    depth: currentDepth,
    results: [searchResults, analysisResults, ...deeperResults],
  };
}

