import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { defineConfig, lazyPlugins } from 'vite-plus';
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
  // Prerender fetches the preview server. On `localhost` it listens on `::1` only, and a render that blocks the
  // event loop for 250 ms fails a pending connection with ETIMEDOUT and a refused IPv4 fallback.
  preview: {
    host: '127.0.0.1',
  },
  plugins: lazyPlugins(async () => [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
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
  ]),
  resolve: {
    tsconfigPaths: true,
  },
});
