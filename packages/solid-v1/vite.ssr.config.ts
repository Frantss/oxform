import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';

/** The server tests: Solid renders to a string in Node, with its server build and no browser. */
export default defineConfig({
  plugins: [solid({ ssr: true })],
  test: { environment: 'node', include: ['tests/server/**/*.spec.ts'], globals: false },
});
