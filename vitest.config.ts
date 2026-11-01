import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    exclude: ['node_modules/**', '.claude/**', '.next/**', 'out/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` throws outside Next's server build; tests run in Node.
      'server-only': path.resolve(__dirname, 'src/shared/queries/server-only-stub.ts'),
    },
  },
});
