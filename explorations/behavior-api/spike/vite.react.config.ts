import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

const modules = (workspace: string, name: string) =>
  fileURLToPath(new URL(`../../../packages/${workspace}/node_modules/${name}`, import.meta.url));

// The React adapter's tests run in a real browser, like the packages'. `vite.config.ts` keeps the node tests.
export default defineConfig({
  resolve: {
    alias: {
      '@tanstack/store': modules('core', '@tanstack/store'),
      react: modules('react', 'react'),
      'react-dom': modules('react', 'react-dom'),
      'vitest-browser-react': modules('react', 'vitest-browser-react'),
    },
  },
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    browser: {
      provider: playwright({}),
      enabled: true,
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }],
    },
    include: ['src/react/**/*.spec.tsx'],
  },
});
