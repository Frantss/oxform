import { fileURLToPath } from 'node:url';
import type { BrowserCommand } from 'vite-plus/test/node';
import { defineConfig } from 'vite-plus';
import solid from '@solidjs/vite-plugin';
import { base } from '../../vite.config';

/**
 * Renders a parity view on the server, for P11. Solid renders no string in a browser, so the test asks Node, which
 * loads the views compiled for the server.
 */
const renderView: BrowserCommand<[view: string, props: object]> = async ({ project }, view, props) => {
  const render = fileURLToPath(new URL('tests/render.ts', import.meta.url));
  const module = (await project.vite.ssrLoadModule(render)) as typeof import('./tests/render');
  return module.renderView(view as never, props).html;
};

export default defineConfig({
  ...base,
  resolve: { dedupe: ['solid-js', '@solidjs/web'] },
  // `ssr`: a module that the server loads renders to a string. In a test the plugin compiles the client code
  // non-hydratable, and P11 hydrates, so `hydratable` asks for it.
  plugins: [solid({ ssr: true, solid: { hydratable: true } })],
  optimizeDeps: { include: ['solid-js', '@solidjs/web', 'vite-plus/test/browser'] },
  test: {
    ...base.test,
    // The Solid plugin sets a jsdom environment when none is set. The tests run in the browser.
    environment: 'node',
    exclude: ['tests/server/**', 'node_modules/**'],
    browser: {
      ...base.test?.browser,
      commands: { renderView },
      instances: [
        { browser: 'chromium', name: 'desktop', viewport: { width: 1280, height: 720 } },
        { browser: 'chromium', name: 'mobile', viewport: { width: 390, height: 844 } },
      ],
    },
  },
  pack: {
    entry: { index: 'export/index.ts' },
    format: ['esm'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: {
      alwaysBundle: [/#.*/],
      neverBundle: [/^solid-js(?:\/.*)?$/, /^@solidjs\//, '@oxform/core', /^@oxform\/core\//],
    },
  },
});
