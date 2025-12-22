import { defineConfig } from 'tsdown';

const ci = process.env.CI === 'true';

export default defineConfig({
  exports: !ci,
  format: ['esm', 'cjs'],
  platform: 'browser',
  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,
  noExternal: [/#.*/],
});
