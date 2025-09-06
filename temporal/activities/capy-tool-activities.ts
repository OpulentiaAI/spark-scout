import { Context } from '@temporalio/activity';

export interface ExecuteCapyToolParams {
  toolName: string;
  parameters: any;
  context?: any;
}

export async function executeCapyTool(
  toolName: string,
  parameters: any,
  _context?: any,
): Promise<any> {
  const activityContext = Context.current();
  activityContext.log.info('Executing Capy tool', { tool: toolName, parameters });

  // Stub implementations to enable workflow-level orchestration and testing.
  // Replace with real integrations incrementally.
  switch (toolName) {
    // File ops (simulate)
    case 'ls':
      return { path: parameters.path || '.', entries: ['a.txt', 'b.ts'] };
    case 'read':
      return { file_path: parameters.file_path, content: 'example content' };
    case 'glob':
      return { pattern: parameters.pattern, matches: [] };
    case 'grep':
      return { pattern: parameters.pattern, matches: [] };
    case 'edit':
      return { file_path: parameters.file_path, edits: parameters.edits, ok: true };
    case 'multi_edit':
      return { file_path: parameters.file_path, edits: parameters.edits, ok: true };
    case 'write':
      return { file_path: parameters.file_path, bytes: (parameters.content || '').length };

    // Image
    case 'image_generate':
      return { imageUrl: 'https://example.com/image.png' };
    case 'image_edit':
      return { ok: true };
    case 'image_search':
      return { results: [] };

    // Web
    case 'web_search':
      return { results: [{ title: 'Result', url: 'https://example.com' }], query: parameters.query || parameters.q };
    case 'browser_navigate':
      return { url: parameters.url, status: 'ok' };
    case 'web_download':
      return { url: parameters.url, path: parameters.path, ok: true };

    // Dev
    case 'bash_run': {
      const cmd = parameters.command || '';
      // Simulate timeout errors when requested
      if (parameters.simulateTimeout) {
        throw new Error('Command timed out');
      }
      return { command: cmd, stdout: 'ok', command_id: 'cmd-123' };
    }
    case 'bash_command_check':
      return { status: 'running', command_id: parameters.command_id };
    case 'code_template':
      return { name: parameters.name, type: parameters.type, content: '// template' };

    // LSP / socials / UI
    case 'lsp':
      return { success: true };
    case 'socials_search':
      return { results: [] };
    case 'computer':
      return { ok: true };

    // Communication
    case 'message_update':
      return { ok: true };
    case 'follow_ups':
      return { ok: true };
    case 'todo':
      return { ok: true };

    // Advanced
    case 'read_agent':
      return { report: 'Summary', files_examined: [] };
    case 'handoff':
      return { ok: true };

    default:
      throw new Error(`Unsupported tool: ${toolName}`);
  }
}

