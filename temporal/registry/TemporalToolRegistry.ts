import { proxyActivities } from '@temporalio/workflow';

export interface CapyTool {
  name: string;
  category: 'file' | 'image' | 'web' | 'dev' | 'project' | 'lsp' | 'social' | 'ui' | 'communication' | 'advanced';
  requiresApproval?: boolean;
  timeout?: string;
  retryPolicy?: {
    initialInterval: string;
    maximumInterval: string;
    maximumAttempts: number;
  };
  constraints?: {
    pathValidation?: boolean;
    tokenLimits?: boolean;
    userAuth?: boolean;
  };
}

type CapyActivities = {
  executeCapyTool: (toolName: string, parameters: any, context?: any) => Promise<any>;
};

export class TemporalToolRegistry {
  private tools = new Map<string, CapyTool>();

  constructor() {
    this.registerCapyTools();
  }

  private proxyFor(tool?: CapyTool) {
    const proxyOptions = {
      startToCloseTimeout: tool?.timeout || '5m',
      retry: {
        initialInterval: 1000,
        maximumInterval: 30000,
        maximumAttempts: tool?.retryPolicy?.maximumAttempts ?? 3,
      },
    } as const;
    return proxyActivities<CapyActivities>(proxyOptions as any);
  }

  private registerCapyTools() {
    // File operations
    this.registerTool({ name: 'ls', category: 'file', timeout: '30s', constraints: { pathValidation: true } });
    this.registerTool({ name: 'read', category: 'file', timeout: '1m', constraints: { pathValidation: true } });
    this.registerTool({ name: 'edit', category: 'file', timeout: '2m', constraints: { pathValidation: true } });
    this.registerTool({ name: 'multi_edit', category: 'file', timeout: '5m', constraints: { pathValidation: true } });
    this.registerTool({ name: 'glob', category: 'file', timeout: '30s' });
    this.registerTool({ name: 'grep', category: 'file', timeout: '1m' });
    this.registerTool({ name: 'write', category: 'file', timeout: '1m' });

    // Image
    this.registerTool({ name: 'image_generate', category: 'image', timeout: '10m', requiresApproval: true, constraints: { pathValidation: true } });
    this.registerTool({ name: 'image_edit', category: 'image', timeout: '8m', requiresApproval: true });
    this.registerTool({ name: 'image_search', category: 'image', timeout: '1m' });

    // Web
    this.registerTool({ name: 'web_search', category: 'web', timeout: '2m' });
    this.registerTool({ name: 'browser_navigate', category: 'web', timeout: '30s' });
    this.registerTool({ name: 'web_download', category: 'web', timeout: '2m' });

    // Dev
    this.registerTool({ name: 'bash_run', category: 'dev', timeout: '10m', constraints: { userAuth: true }, requiresApproval: true });
    this.registerTool({ name: 'bash_command_check', category: 'dev', timeout: '30s' });
    this.registerTool({ name: 'code_template', category: 'dev', timeout: '30s' });

    // LSP
    this.registerTool({ name: 'lsp', category: 'lsp', timeout: '1m' });

    // Socials
    this.registerTool({ name: 'socials_search', category: 'social', timeout: '1m' });

    // UI
    this.registerTool({ name: 'computer', category: 'ui', timeout: '30s' });

    // Communication
    this.registerTool({ name: 'message_update', category: 'communication', timeout: '10s' });
    this.registerTool({ name: 'follow_ups', category: 'communication', timeout: '1s' });
    this.registerTool({ name: 'todo', category: 'communication', timeout: '30s' });

    // Advanced
    this.registerTool({ name: 'read_agent', category: 'advanced', timeout: '5m', constraints: { tokenLimits: true } });
    this.registerTool({ name: 'handoff', category: 'advanced', timeout: '1s', constraints: { tokenLimits: true } });
  }

  registerTool(tool: CapyTool) {
    this.tools.set(tool.name, tool);
  }

  async executeTool(toolName: string, parameters: any, context?: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);
    const activities = this.proxyFor(tool);
    return await activities.executeCapyTool(toolName, parameters, context);
  }

  getToolsByCategory(category: string): CapyTool[] {
    return Array.from(this.tools.values()).filter((t) => t.category === category);
  }

  getAllTools(): CapyTool[] {
    return Array.from(this.tools.values());
  }
}
