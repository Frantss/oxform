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

The docs run on the `oxform-docs` Cloudflare Worker. `cloudflare.config.ts` sets the account, the
compatibility date, Node compatibility, observability and the domains. `workers.dev` stays on. Only a
production-mode build declares `oxform.frantss.uy`.

The Worker runs TanStack Start's server entry, so `/api/search`, the server functions, the legacy redirects and
the real 404s work as in development. Static files answer before the Worker, except on `/docs*`
(`runWorkerFirst`): there the app answers Markdown, for a `.md` URL or for `Accept: text/markdown`. A rule
matches the path only, so it cannot select by the `Accept` header. HTML handling is off (`htmlHandling: 'none'`)
so the `playground.html` iframe URLs stay as they are. The Worker renders each HTML page; the prerendered HTML
files are not served.

Keep the docs-local `vite-plus` dependency so `cf` detects the build tool. The plugins stay inside
`lazyPlugins` so the Vite+ commands that only read metadata do not start Cloudflare's build. Keep `.cloudflare`
in `.gitignore`: Tailwind scans the files that git does not ignore, and a scan of the build output changes the
server's stylesheet hash, so the HTML links a stylesheet that does not exist.

Run from the repository root:

```bash
pnpm run build           # the libraries, the playgrounds and the docs (cf build)
pnpm run docs:check:agents
pnpm run docs:preview    # the built Worker at http://127.0.0.1:4173
```

The build writes the Worker and its assets to `apps/docs/.cloudflare/output/v0/`. `cf build` and
`cf deploy` do not run package scripts, so build with `docs:build` (or `build`): it also generates the
comparison data and rebuilds the playground previews. Pass `-- --port <port>` to `docs:preview` for another
port.

Check the build, then deploy it. The dry run needs no login. The deploy needs Cloudflare authentication:

```bash
pnpm --dir apps/docs exec cf deploy --dry-run --prebuilt --mode production
pnpm run docs:deploy     # docs:build, then cf deploy --prebuilt --mode production
```

`cf` declares Node `^22.23.0 || ^24.22.0 || ^26.12.0` (`apps/docs/package.json`, `engines`).

- Health check: `/docs`
