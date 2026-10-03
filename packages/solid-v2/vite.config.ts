import { defineConfig } from 'vite-plus';
import solid from '@solidjs/vite-plugin';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  resolve: {
    alias: { 'oxform-solid/v2': new URL('./export/index.ts', import.meta.url).pathname },
    dedupe: ['solid-js', '@solidjs/web'],
  },
  plugins: [solid({ solid: { hydratable: true } })],
  optimizeDeps: { include: ['solid-js', '@solidjs/web', 'vite-plus/test/browser'] },
  test: {
    ...base.test,
    environment: 'node',
    include: ['src/tests/**/*.spec.{ts,tsx}'],
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
    format: ['esm', 'cjs'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: { alwaysBundle: [/#.*/], neverBundle: [/^solid-js(?:\/.*)?$/, /^@solidjs\//, 'oxform-core', 'remeda'] },
  },
});
