import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  plugins: [solid()],
  optimizeDeps: { include: ['solid-js', 'solid-js/web', 'vite-plus/test/browser'] },
  test: { ...base.test, environment: 'node' },
  resolve: {
    alias: {
      '@oxform/core': fileURLToPath(new URL('../../packages/core/export/index.ts', import.meta.url)),
      '@oxform/solid': fileURLToPath(new URL('../../packages/solid-v1/export/index.ts', import.meta.url)),
    },
  },
});
