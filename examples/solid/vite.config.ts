import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
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
  optimizeDeps: { include: ['solid-js', 'solid-js/web', 'vite-plus/test/browser'] },
  test: { ...base.test, environment: 'node' },
  resolve: {
    // The sources of the packages, so the app needs no build of them. Each entry point is matched whole.
    alias: [
      { find: /^@oxform\/core$/u, replacement: source('core/export/index.ts') },
      { find: /^@oxform\/core\/(adapter|behaviors|presets)$/u, replacement: source('core/export/$1.ts') },
      { find: /^@oxform\/solid$/u, replacement: source('solid-v1/export/index.ts') },
    ],
  },
});
