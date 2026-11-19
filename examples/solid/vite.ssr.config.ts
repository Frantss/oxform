import { defineConfig } from 'vite-plus';
import solid from 'vite-plugin-solid';
import app from './vite.config';

/** The server tests: Solid renders to a string in Node, with its server build and no browser. */
export default defineConfig({
  resolve: app.resolve,
  plugins: [solid({ ssr: true })],
  test: { environment: 'node', include: ['tests/server/**/*.spec.ts'], globals: false },
});
