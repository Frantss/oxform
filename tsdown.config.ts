import { defineConfig } from 'tsdown';

export default defineConfig({
  exports: {
    enabled: true,
    devExports: true,
  },
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
  platform: 'browser',
});
