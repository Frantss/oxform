import { defineConfig } from 'vite-plus';
import { base } from '../../vite.config';

const node = { environment: 'node', browser: { enabled: false } } as const;

export default defineConfig({
  ...base,
  test: {
    globals: false,
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts'],
    },
    projects: [
      { test: { name: 'unit', include: ['src/**/*.spec.ts'], ...node } },
      { test: { name: 'integration', include: ['tests/*.spec.ts'], ...node } },
    ],
  },
  pack: {
    entry: {
      index: 'export/index.ts',
      behaviors: 'export/behaviors.ts',
      presets: 'export/presets.ts',
      adapter: 'export/adapter.ts',
    },
    format: ['esm'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: {
      alwaysBundle: [/#.*/],
    },
  },
});
