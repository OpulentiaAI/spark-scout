export const temporalConfig = {
  development: {
    address: 'localhost:7233',
    namespace: 'default',
    tls: undefined as any,
  },
  production: {
    address: process.env.TEMPORAL_ADDRESS!,
    namespace: process.env.TEMPORAL_NAMESPACE!,
    tls: {},
  },
};

export const taskQueues = {
  CHAT_PROCESSING: 'chat-processing',
  TOOL_INVOCATION: 'tool-invocation',
  RESEARCH: 'research',
  BACKGROUND: 'background-tasks',
} as const;

