import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { defineConfig } from 'vite';
import { listPageFiles, markdownUrlOf, pageUrlOf } from './content-pages';
import { playgroundAssets } from './playground-assets';

const pageUrls = listPageFiles(import.meta.dirname).map(pageUrlOf);

/** The crawl finds no link to the text routes, so they are listed. Hidden pages are listed too. */
const prerenderedPaths = ['/', '/llms.txt', '/llms-full.txt', ...pageUrls, ...pageUrls.map(markdownUrlOf)];

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
      pages: prerenderedPaths.map(path => ({ path })),
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
