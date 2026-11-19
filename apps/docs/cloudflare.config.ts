import { defineConfig } from 'cf/config';

export default defineConfig(({ mode }) => ({
  accountId: '3840e9fab371f44281c4d0cd5d247f26',
  worker: {
    name: 'oxform-docs',
    entrypoint: '@tanstack/react-start/server-entry',
    compatibilityDate: '2026-11-06',
    compatibilityFlags: ['nodejs_compat'],
    domains: mode === 'production' ? ['oxform.frantss.uy'] : [],
    workersDev: true,
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      // The app answers Markdown: a docs URL that ends in `.md`, or a docs URL with `Accept: text/markdown`. A rule
      // matches the path only, and a static file would answer first.
      runWorkerFirst: ['/docs*'],
    },
    observability: { enabled: true, traces: { enabled: true } },
  },
}));
