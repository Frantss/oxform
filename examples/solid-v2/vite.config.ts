import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';
import solid from '@solidjs/vite-plugin';
import { base } from '../../vite.config';

const source = (path: string) => fileURLToPath(new URL(`../../packages/${path}`, import.meta.url));

export default defineConfig({
  ...base,
  base: './',
  build: {
    rolldownOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        playground: fileURLToPath(new URL('./playground.html', import.meta.url)),
      },
    },
  },
  plugins: [solid()],
  optimizeDeps: { include: ['solid-js', '@solidjs/web', 'vite-plus/test/browser'] },
  test: {
    ...base.test,
    environment: 'node',
    // As in `packages/solid-v2`, the flows also run at the size of a phone (03-testing.md).
    browser: {
      ...base.test?.browser,
      instances: [
        { browser: 'chromium', name: 'desktop', viewport: { width: 1280, height: 720 } },
        { browser: 'chromium', name: 'mobile', viewport: { width: 390, height: 844 } },
      ],
    },
  },
  resolve: {
    dedupe: ['solid-js', '@solidjs/web'],
    // The sources of the packages, so the app needs no build of them. Each entry point is matched whole.
    alias: [
      { find: /^@oxform\/core$/u, replacement: source('core/export/index.ts') },
      { find: /^@oxform\/core\/(adapter|behaviors|presets)$/u, replacement: source('core/export/$1.ts') },
      { find: /^@oxform\/solid\/v2$/u, replacement: source('solid-v2/export/index.ts') },
    ],
  },
});
