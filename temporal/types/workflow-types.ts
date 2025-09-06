export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
  timestamp: number;
}

export interface ModelConfig {
  model: string;
  provider: string;
  capabilities?: string[];
}

export interface ToolInvocation {
  name: string;
  parameters: Record<string, any>;
}

