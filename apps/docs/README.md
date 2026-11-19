# Oxform Docs

Public documentation website for Oxform, built with TanStack Start and
Fumadocs. Contributor guides live in the root [docs directory](../../docs/).

## Run Locally

Run from the repository root:

```bash
pnpm install
pnpm run build            # the docs build reads the built packages
pnpm run docs:dev
pnpm run docs:build
pnpm run docs:check
pnpm run docs:check:agents  # after docs:build
```

Open [localhost:3002](http://localhost:3002). `docs:check` generates Fumadocs metadata and runs TypeScript.
`docs:build` also checks MDX compilation and Twoslash snippets, and Twoslash reads `packages/*/dist`.

## Edit Documentation

**Pages.** Public pages live in `content/docs/<section>/`. The sections are `core`, `concepts`, `compose`,
`extend`, `behaviors`, `presets`, `adapters`, `recipes` and `migration`, beside the top-level pages. Each
section's `meta.json` lists its pages in sidebar order. A name that starts with `!` hides the page from the
sidebar and from `llms.txt`, but keeps its URL.

**Templates.** Copy `content/docs/templates/<type>.mdx` into the section folder. The types are `concept`,
`guide`, `reference`, `extension`, `recipe`, `adapter` and `overview`. Keep the fixed H2 headings, in order.
Delete only the headings that the template marks optional.

**Frontmatter.** Every page has all of these:

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| `title`       | The page name                                                                         |
| `description` | One sentence that states the task                                                     |
| `type`        | One of the seven template types                                                       |
| `entry`       | The entry points that the page imports from, such as `['@oxform/core']`               |
| `principles`  | Any of `composable`, `reusable`, `extensible`, `type-safe`, `lightweight`             |
| `examples`    | Catalogue ids (`E01`). Guide, reference, extension and recipe pages need at least one |

**Examples.** The example catalogue is the only source of examples. Each id (`E01` to `E33`, and so on) must
appear in `examples/kit/src`, `examples/react/src`, `examples/solid/src` or `examples/solid-v2/src`. A page
includes the example file and does not copy it:

```mdx
<include meta='twoslash'>path of the example file</include>
```

When the example file has relative imports, include it with `meta='no-check="checked in the example kit"'`.
The kit type-checks and tests the file.

**Code fences.** Each `ts` or `tsx` fence needs `twoslash`, or `no-check="<reason>"`, and an import from an
`@oxform/` entry point. A snippet has 25 lines at most and no `---cut---`. A Solid 1 snippet starts with
`// @jsxImportSource solid-js`. Solid 2 snippets cannot be checked in this app. Include them from
`examples/solid-v2`.

**Headings.** A heading that is not a fixed H2 needs an explicit id: `## Title [#id]`. After you add a
heading, record the id and commit `scripts/heading-ids.json`:

```bash
pnpm --dir apps/docs run check:agents --record-heading-ids
```

Never remove a recorded id without a recorded decision.

**Images.** A page has no image unless `scripts/image-allowlist.json` names it and the text states the same
fact.

**Terms.** Use the glossary terms (see the [glossary](../../docs/code-style.md#glossary)). The agent check
fails on a word that the glossary replaces.

**Agent checks.** `pnpm run docs:check:agents` runs after `docs:build`. Each failure prints
`file[:line]: [rule] message`. It checks that:

- every page has a non-empty Markdown output, and `llms.txt` lists each page once with a link that resolves;
- `llms-full.txt` holds each page title;
- each page has the fixed headings of its type, in order;
- each code fence follows the rules above, and no page uses `---cut---` or an unlisted image;
- no page uses a forbidden term;
- once a folder of `core/`, `behaviors/` or `presets/` has a page, each runtime export of its entry point
  has a page in that folder, and each page names an export;
- each page names catalogue ids that exist;
- no recorded heading id is missing.

Other notes:

- `source.config.ts` configures the content collection and code transformers. `src/lib/source.ts` maps
  pages to `/docs`. `content-pages.ts` lists the page folders.
- Keep the generated `src/routeTree.gen.ts` out of manual edits. Format changed files from the root, for
  example `pnpm run fix:format apps/docs/README.md`.
- For changes to rendered behavior, inspect desktop and mobile layouts and check the browser console for
  runtime, SSR, or hydration failures.

## Playground

Open [the playground](http://localhost:3002/playground) to try the five domain forms in
React, Solid 1 or Solid 2. The page includes source files, a demo console,
reset, and links that retain the framework and example.

Each example workspace builds a separate `playground.html` entry using its
own compiler and runtime. The docs app serves these builds in iframes and
includes them in production output. Source viewing reads the original
example files through Vite's raw imports. Fumadocs highlights the TSX source
with Shiki using the docs' GitHub light and dark palettes.

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

## Production

After building, run `pnpm run docs:start` from the repository root.
`server.ts` starts srvx with `dist/server/server.js`, serves static files from
`dist/client`, and listens on `0.0.0.0` using `PORT` (default `3000`). It sends
Markdown requests (a `.md` URL, or `Accept: text/markdown` on a docs URL) to the
app before the static files.

On Railway, keep the repository root as the build context and set:

- Build command: `pnpm exec vp run --filter '@oxform/docs...' build`
- Start command: `pnpm --dir apps/docs run start`
- Health check: `/docs`
- Environment: `RAILPACK_NODE_VERSION=24`, `NODE_ENV=production`, `PORT=8080`

The build includes the docs workspace and its dependencies, including all
three playground previews.
