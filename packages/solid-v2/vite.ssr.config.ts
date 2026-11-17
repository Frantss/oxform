import { defineConfig } from 'vite-plus';
import solid from '@solidjs/vite-plugin';

/** The server tests: Solid renders to a string in Node, with its server build and no browser. */
export default defineConfig({
  resolve: { dedupe: ['solid-js', '@solidjs/web'] },
  plugins: [solid({ ssr: true })],
  test: { environment: 'node', include: ['tests/server/**/*.spec.ts'], globals: false },
});
