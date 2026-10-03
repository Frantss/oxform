import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';
import solid from '@solidjs/vite-plugin';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  plugins: [solid()],
  optimizeDeps: { include: ['solid-js', '@solidjs/web', 'vite-plus/test/browser'] },
  test: { ...base.test, environment: 'node' },
  resolve: {
    dedupe: ['solid-js', '@solidjs/web'],
    alias: {
      'oxform-core': fileURLToPath(new URL('../../packages/core/export/index.ts', import.meta.url)),
      'oxform-solid/v2': fileURLToPath(new URL('../../packages/solid-v2/export/index.ts', import.meta.url)),
    },
  },
});
