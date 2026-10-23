import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: { alias: { '@oxform/solid': new URL('./export/index.ts', import.meta.url).pathname } },
  test: {
    environment: 'node',
    browser: { enabled: false },
    include: ['src/server-tests/**/*.spec.ts'],
  },
});
