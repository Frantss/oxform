import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  resolve: { dedupe: ['solid-js'] },
  plugins: [solid()],
  optimizeDeps: { include: ['solid-js', 'solid-js/web', 'vite-plus/test/browser'] },
  // The Solid plugin sets a jsdom environment when none is set. The tests run in the browser.
  test: { ...base.test, environment: 'node' },
  pack: {
    entry: { index: 'export/index.ts' },
    format: ['esm'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: { alwaysBundle: [/#.*/], neverBundle: [/^solid-js(?:\/.*)?$/, '@oxform/core', /^@oxform\/core\//] },
  },
});
