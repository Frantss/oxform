# Oxform Docs

Public documentation website for Oxform, built with TanStack Start and
Fumadocs. Contributor guides live in the root [docs directory](../../docs/).

## Run Locally

Run from the repository root:

```bash
pnpm install
pnpm run docs:dev
pnpm run docs:build
pnpm run docs:check
```

Open [localhost:3002](http://localhost:3002).

Build the libraries before the first docs build when their `dist/` outputs
are missing: `pnpm run build` builds the workspaces in dependency order.
`docs:check` generates Fumadocs metadata and runs TypeScript; use
`docs:build` to check MDX compilation and Twoslash snippets.

## Edit Documentation

- Edit guides, recipes, and API pages in `content/docs/`, under `core/`,
  `react/`, or `solid/`.
- Update each section's `meta.json` when changing its navigation.
- Mark TypeScript examples with `ts twoslash` or `tsx twoslash` to check them
  during MDX compilation.
- API pages use `auto-type-table` blocks backed by the TypeScript re-export
  files in `content/docs/*/api/`. Keep those imports aligned with public exports.
- `source.config.ts` configures the content collection and code transformers.
  `src/lib/source.ts` maps pages to `/docs`.

Keep the generated `src/routeTree.gen.ts` out of manual edits. Format changed
files from the root, for example:

```bash
pnpm run fix:format apps/docs/README.md apps/docs/content/docs/react/index.mdx
```

Check documentation links after editing. For changes to rendered behavior,
also inspect desktop and mobile layouts and check the browser console for
runtime, SSR, or hydration failures.

## Playground

Open [the playground](http://localhost:3002/playground) to try all seven React
examples or the Solid 1 and Solid 2 account forms. The page includes source
files, a demo console, reset, and links that retain the framework and example.

Each example workspace builds a separate `playground.html` entry using its
own compiler and runtime. The docs app serves these builds in iframes and
includes them in production output. Source viewing reads the original
example files through Vite's raw imports.

The playground renders on the client. Its query variants share one static
HTML path, so prerendering includes only the base `/playground` page.

`docs:dev` and `docs:build` build the previews automatically. After editing
an example while the docs server is running, rebuild the previews and press
Reset demo:

```bash
pnpm --dir apps/docs run playground:build
```

## Theme

The site uses `@frantss/fumadocs-theme` for Geist Mono typography, light and
dark palettes, and documentation layout. `src/styles/app.css` imports its
stylesheet, followed by the Twoslash styles. Documentation pages and the
navigation title use the package's component wrappers.

Keep `@frantss/fumadocs-theme` in `ssr.noExternal` in `vite.config.ts` so
the theme and Fumadocs share provider contexts during server rendering.

## Production Start Limitation

`pnpm run docs:start` currently targets `.output/server/index.mjs`, while
the observed build output is `dist/server/server.js`. The configured target
is missing after a build, so this command fails with `MODULE_NOT_FOUND`.
The target is configured in this workspace's [package.json](./package.json).
