import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

// The spike sits outside the workspace, so its dependencies resolve from the packages that already install them.
const modules = (location: string, name: string) =>
  fileURLToPath(new URL(`../../../${location}/node_modules/${name}`, import.meta.url));

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@tanstack/store': modules('packages/core', '@tanstack/store'),
      '@tanstack/react-store': modules('packages/react', '@tanstack/react-store'),
      react: modules('packages/react', 'react'),
      'react-dom': modules('packages/react', 'react-dom'),
      zod: modules('examples/react', 'zod'),
    },
  },
});
