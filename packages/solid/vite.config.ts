import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  plugins: [solid()],
  optimizeDeps: { include: ['solid-js', 'solid-js/web', 'vite-plus/test/browser'] },
  test: { ...base.test, environment: 'node', include: ['src/tests/**/*.spec.{ts,tsx}'] },
  pack: {
    entry: { index: 'export/index.ts' },
    format: ['esm', 'cjs'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: { alwaysBundle: [/#.*/] },
  },
});
