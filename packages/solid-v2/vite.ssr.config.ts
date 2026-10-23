import { defineConfig } from 'vite-plus';
import solid from '@solidjs/vite-plugin';

export default defineConfig({
  plugins: [solid({ solid: { hydratable: true } })],
  resolve: { alias: { '@oxform/solid/v2': new URL('./export/index.ts', import.meta.url).pathname } },
  test: {
    environment: 'node',
    browser: { enabled: false },
    include: ['src/server-tests/**/*.spec.{ts,tsx}'],
  },
});
