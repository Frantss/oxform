import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    environment: 'node',
    browser: { enabled: false },
    include: ['src/server-tests/**/*.spec.ts'],
  },
});
