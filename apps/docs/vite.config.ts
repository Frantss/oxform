import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { defineConfig } from 'vite';
import { playgroundAssets } from './playground-assets';

export default defineConfig({
  ssr: {
    noExternal: ['@frantss/fumadocs-theme'],
  },
  server: {
    port: 3002,
  },
  plugins: [
    playgroundAssets(),
    mdx(await import('./source.config')),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        filter: page => !page.path.startsWith('/playground?'),
      },
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
