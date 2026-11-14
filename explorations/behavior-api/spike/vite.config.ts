import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

const coreModules = (name: string) =>
  fileURLToPath(new URL(`../../../packages/core/node_modules/${name}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@tanstack/store': coreModules('@tanstack/store'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  // Bundle-size tiers: `pnpm exec vp pack`, then `node measure-bundles.ts`. The baseline is the built `@oxform/core`.
  // One build per tier, so shared code is not split into chunks and each size is complete.
  pack: Object.entries({
    'tier-values': 'src/bundle/tier-values.ts',
    'tier-status-events': 'src/bundle/tier-status-events.ts',
    'tier-values-and-check': 'src/bundle/tier-values-and-check.ts',
    'tier-values-check-fragments': 'src/bundle/tier-values-check-fragments.ts',
    'tier-lean-login': 'src/bundle/tier-lean-login.ts',
    'tier-full-preset': 'src/bundle/tier-full-preset.ts',
    'baseline-core': '../../../packages/core/dist/index.js',
  }).map(([name, entry]) => ({
    entry: { [name]: entry },
    outDir: `dist/${name}`,
    format: ['esm' as const],
    platform: 'browser' as const,
    dts: false,
    minify: true,
    clean: true,
    deps: {
      alwaysBundle: [/^@tanstack\//, /^remeda/],
    },
  })),
});
