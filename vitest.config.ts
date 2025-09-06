import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['temporal/**/__tests__/**/*.test.ts', 'temporal/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
