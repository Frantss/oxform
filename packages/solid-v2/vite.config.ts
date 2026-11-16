import { defineConfig } from 'vite-plus';
import solid from '@solidjs/vite-plugin';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  resolve: { dedupe: ['solid-js', '@solidjs/web'] },
  plugins: [solid({ solid: { hydratable: true } })],
  optimizeDeps: { include: ['solid-js', '@solidjs/web', 'vite-plus/test/browser'] },
  // The Solid plugin sets a jsdom environment when none is set. The tests run in the browser.
  test: {
    ...base.test,
    environment: 'node',
    browser: {
      ...base.test?.browser,
      instances: [
        { browser: 'chromium', name: 'desktop', viewport: { width: 1280, height: 720 } },
        { browser: 'chromium', name: 'mobile', viewport: { width: 390, height: 844 } },
      ],
    },
  },
  pack: {
    entry: { index: 'export/index.ts' },
    format: ['esm'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: {
      alwaysBundle: [/#.*/],
      neverBundle: [/^solid-js(?:\/.*)?$/, /^@solidjs\//, '@oxform/core', /^@oxform\/core\//],
    },
  },
});
