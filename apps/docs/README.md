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

## Production Start Limitation

`pnpm run docs:start` currently targets `.output/server/index.mjs`, while
the observed build output is `dist/server/server.js`. The configured target
is missing after a build, so this command fails with `MODULE_NOT_FOUND`.
The target is configured in this workspace's [package.json](./package.json).
