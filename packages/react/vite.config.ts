import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  plugins: [react()],
  // The server tests run in Node through `vite.ssr.config.ts`.
  test: { ...base.test, exclude: ['tests/server/**', '**/node_modules/**'] },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  pack: {
    entry: {
      index: 'export/index.ts',
    },
    format: ['esm'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: {
      alwaysBundle: [/#.*/],
      neverBundle: ['@oxform/core', /^@oxform\/core\//],
    },
  },
});
