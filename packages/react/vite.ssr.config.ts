import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

/** The server tests: React renders to a string in Node, with no browser. */
export default defineConfig({
  plugins: [react()],
  test: { environment: 'node', include: ['tests/server/**/*.spec.tsx'], globals: false },
});
