import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
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
  plugins: [react()],
  resolve: {
    // The sources of the packages, so the app needs no build of them. Each entry point is matched whole.
    alias: [
      { find: /^@oxform\/core$/u, replacement: source('core/export/index.ts') },
      { find: /^@oxform\/core\/(adapter|behaviors|presets)$/u, replacement: source('core/export/$1.ts') },
      { find: /^@oxform\/react$/u, replacement: source('react/export/index.ts') },
    ],
  },
});
