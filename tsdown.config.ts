import { defineConfig } from 'tsdown';

export default defineConfig({
  exports: {
    enabled: true,
  },
  format: ['esm', 'cjs'],
  platform: 'browser',
  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,
  noExternal: [/#.*/],
});
