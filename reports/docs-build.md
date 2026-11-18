# Documentation Build

- `apps/docs/source.config.ts:30`: Twoslash receives the numeric compiler option
  `jsx: 4`. The installed Twoslash compiler-options parser rejects it with
  `Compiler option 'jsx' requires a value of type enum.` This prevents the
  documentation production build from compiling typed code examples. Observed
  while verifying the public API documentation revision with `bun run docs:build`.

- The JSX setting was corrected to `react-jsx` while starting the documentation
  server. The form API page subsequently returned HTTP 200 on localhost:3002.
  The production build has not been rerun since this correction.

- Production verification before committing passed after allowing the local
  preview port required by prerendering. The build compiled the documentation
  and prerendered all 18 pages. The earlier JSX error is resolved.

- Solid 2 documentation verification on 2026-10-02 passed and prerendered
  36 page and anchor URLs. Vite reported that
  `apps/docs/dist/client/assets/index-C_8JQxTq.js:1` is 665.10 kB minified
  (219.91 kB gzip), above its 500 kB chunk warning threshold. This increases
  the size of the client bundle downloaded by documentation readers.

## 2026-11-18

- `pnpm run docs:build` failed in prerender in about 2 of 10 runs with `fetch failed`: `ETIMEDOUT` on `::1`
  and `ECONNREFUSED` on `127.0.0.1`, each time while `/playground` rendered. TanStack Start prerenders by
  fetching a Vite preview server in the same process
  (`@tanstack/start-plugin-core/dist/esm/vite/prerender.js:14-28`), at its `localhost` URL. On macOS the preview
  server listens on `::1` only. Node tries `::1`, then `127.0.0.1`, with a 250 ms timeout per address. A render
  that blocks the event loop for longer makes a pending `::1` connection time out, and the IPv4 fallback is
  refused. A Node probe (a server on `localhost`, a connection pending, the loop blocked for 600 ms) gave the
  same pair of errors, and passed on `127.0.0.1`. Fix: `preview.host: '127.0.0.1'` in
  `apps/docs/vite.config.ts`, so the preview URL is `http://127.0.0.1:<port>/`, with one address and no
  fallback.
