import { defineConfig } from 'vite-plus';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  test: {
    globals: false,
    projects: [{ test: { name: 'package', include: ['tests/package/**/*.spec.ts'], environment: 'node' } }],
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
