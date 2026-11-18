---
id: TK-059
title: Agent outputs
phase: 8
work_package: P8-02
status: done
depends_on: [TK-058]
branch: codex/P8-02-agent-outputs
pr: null
started: 2026-11-18
completed: 2026-11-18
---

# TK-059: Agent outputs

## Outcome

The site serves `/llms.txt`, `/llms-full.txt` and a Markdown form of each page, and each HTML page has page
actions. `pnpm run docs:check:agents` and `pnpm run check:terms` run in `check:all` or CI and fail on a broken
page or a forbidden term. Each docs tool check has a recorded result.

## Scope

- In: the outputs of `04-documentation.md#7.2`: the index, the full text, the page Markdown route with
  `includeProcessedMarkdown` and `rewritePath`, content negotiation, and the page actions.
  `apps/docs/scripts/check-agents.ts` with every check of `04#7.5`, the `check:agents` script of
  `@oxform/docs`, the root `docs:check:agents`, and the committed list of heading ids. `scripts/check-terms.ts`
  and the root `check:terms`, with the term list of `04#7.3` rule 9 kept in one place for both checks. Add
  `check:terms` to `check:all`, `check:terms` and `docs:check:agents` to CI in the order of `02#CI`, and
  `docs:check:agents` to `prepublish` (`02#Tooling and scripts`). The tool checks of `04#7.2` (items 1 to 4)
  and the `<include>` check of `04#8`.
- Out: page content (TK-060 to TK-068). The in-package `docs/`
  folders and `docs:package` (stage B, D40, recorded by TK-074). An MCP server, per-section indexes and a
  skill (D47).

## Read first

- `04-documentation.md#7.2`: the outputs, the helpers that generate them and the four verification tasks.
- `04-documentation.md#7.3`: the page rules, and rule 9 for the term list.
- `04-documentation.md#7.5`: the checks of `docs:check:agents`.
- `04-documentation.md#8`: Twoslash on an included block, and its fallback.
- `04-documentation.md#11`: decision 10, the tool behavior to verify.
- `02-structure.md#Tooling and scripts` and `02-structure.md#CI`: the scripts, `check:all`, `prepublish` and
  the CI step order.
- `00-direction.md#Glossary`: the terms the checks allow.
- `reports/fumadocs-typescript.md` and `reports/fumadocs-twoslash.md`: the known tool faults to recheck.

## Decisions to apply

- D47: build no MCP server, no skill, no per-section index and no versioned site.

## Acceptance

- [x] `pnpm run docs:check:agents` passes after `pnpm run docs:build`.
- [x] Each check of `04#7.5` fails on a planted fault: an empty `.md` output, a dead `llms.txt` link, a
      missing fixed heading, a block with no `twoslash`, a `---cut---`, a forbidden term, a removed heading id.
- [x] `pnpm run check:terms` fails on a forbidden term in `packages/*/src` and allows `PropKind` and
      "prop kind". `pnpm run check:all` runs it.
- [x] CI runs `check:terms` and `docs:check:agents` in the order of `02#CI`.
- [x] The three text routes are prerendered, and the `.md` route answers `Accept: text/markdown` on the srvx
      server.
- [x] Each of the four tool checks of `04#7.2` and the `<include>` check of `04#8` has a recorded result.
- [x] The page actions work at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [x] `pnpm run build`, `pnpm run check:all` and `pnpm run check:format` pass.

## Evidence

Rewording commit `64cec47` (approved by the coordinator): the 7 forbidden terms that `check:terms` found in
`docs/form-core-behaviors.md:397`, `docs/structure.md:60`, `packages/adapter-parity/src/fixtures.ts:93`,
`packages/core/src/internal/paths.spec.ts:32` and `:68`, `packages/core/src/main/scopes.ts:29` and
`packages/core/tests/types/main.test-d.ts:574` now use glossary words.

- Outputs: `/llms.txt` (`src/routes/llms[.]txt.ts`), `/llms-full.txt` (`src/routes/llms-full[.]txt.ts`),
  `/docs.md` (`src/routes/docs[.]md.ts`) and `/docs/<slug>.md` (the `GET` handler of `src/routes/docs.$.tsx`,
  with `rewritePath('/docs{/*path}.md', '/docs{/*path}')`). `src/lib/markdown.ts` builds them from
  `page.data.getText('processed')` (`includeProcessedMarkdown` in `source.config.ts`). `llms.txt` uses
  `llms(source).index()` with its links rewritten to `.md`, and the summary is the `description` of the root
  `meta.json`. `llms-full.txt` renders the sidebar pages in sidebar order. `.full()` is not used, because it
  follows `getPages()`, not the sidebar.
- Hidden pages (`!name` in a `meta.json`) have an HTML page and a `.md` output. They are not in `llms.txt` or
  `llms-full.txt`, like the sidebar.
- Content negotiation: `isMarkdownPreferred` in the same handler. srvx serves static files first, and each
  page has a prerendered HTML file. So `apps/docs/server.ts` (the new `start` script) starts srvx with a
  middleware that sends a `.md` URL or a docs URL with `Accept: text/markdown` to the app before the static
  files. On `PORT=3110 pnpm run docs:start`: `/docs` with `Accept: text/markdown` returned 200
  `text/markdown`; with `Accept: text/html`, HTML. `/docs.md` 200 `text/markdown`, `/llms.txt` and
  `/llms-full.txt` 200 `text/plain`, `/docs/nope.md` 404, `/docs/react` and `/docs/core` 307 to `/docs`,
  `/playground` 200, `/api/search?query=oxform` 200.
- Page actions: `MarkdownCopyButton` and `ViewOptionsPopover` from `fumadocs-ui/layouts/docs/page`, as
  children of the theme's `DocsPage` (item 4: it accepts them). Playwright on the production server, 1280x800
  and 390x844: "Copy Markdown" put `# Oxform ...` on the clipboard, "Open" listed "View as Markdown" with
  `/docs.md`, and the link opened the Markdown. No console error or warning, no page error, no hydration
  warning. Screenshots `desktop-page-actions.png`, `desktop-view-options.png`, `mobile-page-actions.png` and
  `mobile-view-options.png` in the session scratchpad (`tk-059/`).
- Tool check 1 (prerender): the crawl alone prerendered only `/`, `/playground` and `/docs`. Fallback taken:
  `vite.config.ts` lists `/`, `/llms.txt`, `/llms-full.txt` and the HTML and `.md` URL of each content page
  (`content-pages.ts`). The build now prerenders `/llms.txt`, `/llms-full.txt` and `/docs.md`.
- Tool check 2 (Twoslash notations in Markdown): a probe page kept `// ^?`, `// @errors: 2769` and the
  `twoslash` meta in its `.md` output. Rule 3 holds. Finding in `reports/fumadocs-twoslash.md`.
- Tool check 3 (type tables): `auto-type-table` of `ResetOptions` came out as a Markdown table. No
  `mdxAsPlaceholder` needed. The type column loses detail. Finding in `reports/fumadocs-typescript.md`.
- Tool check 4 (page actions in `DocsPage`): passed, see above.
- `<include>` check (`04#8`): `<include meta="twoslash">` runs Twoslash on the included file. A planted type
  error in it failed `docs:build` (error 2322). A kit file with a relative import fails (error 2307), so such a
  block takes `no-check="checked in the example kit"`. The probe files were removed.
- `docs:check:agents` (`apps/docs/scripts/check-agents.ts`) passes after `pnpm run docs:build`: "1 pages and
  7 templates pass". Planted faults, each reverted, each failed with its rule: empty `docs.md`
  (`[markdown-output]`), a dead link in `llms.txt` (`[llms-index]`), an empty `llms-full.txt` (`[llms-full]`),
  no "In short" on the index and no "Model" on a concept page (`[fixed-headings]`), a `ts` block without
  `twoslash` and one without an `@oxform/` import (`[code-blocks]`), `// ---cut---` (`[hidden-code]`), an
  image (`[images]`), "plugin" and "stage" (`[terms]`), an id in `heading-ids.json` with no heading
  (`[heading-ids]`), a heading with no explicit id (`[heading-id]`), `examples: [E99]` (`[catalogue]`), a
  `presets/` page with no export (`[inventory]`).
- `check:terms` (`scripts/check-terms.ts`, the one term list for both checks): a probe file in
  `packages/core/src` failed on "A plugin" in a comment and "every kind of input" in a string. "prop kind", a
  `PropKind` type and a `kind` variable passed. `check:all` runs it after `check`.
- CI (`.github/workflows/ci.yml`): `check`, `check:terms`, `check:package`, `docs:check:agents`, then
  `test:coverage` and `test`, the order of `02#CI`. `prepublish` ends with `docs:check:agents`.
- Commands, from the repository root: `pnpm run build` (12/12), `pnpm run docs:build` (passed),
  `pnpm run docs:check:agents` (passed), `pnpm run check:format` (passed), `pnpm run check:package` and
  `pnpm run check:parity` (passed), `pnpm run test` (passed). After the rebase onto `eccecd1` and the
  rewording: `pnpm run build`, `pnpm run check:all` ("check:terms: no forbidden term in 261 files"),
  `pnpm run test`, `pnpm run docs:build`, `pnpm run docs:check:agents` and `pnpm run check:format` passed.
- Two of about ten `docs:build` runs failed in prerender with `fetch failed` (`ETIMEDOUT` on `::1`,
  `ECONNREFUSED` on `127.0.0.1`). Cause: the prerender preview server listened on `localhost` (`::1` only), and
  a render that blocks the event loop past the 250 ms connection timeout fails a pending connection. Fix
  (commit `9ed56b7`): `preview.host: '127.0.0.1'` in `apps/docs/vite.config.ts`. A Node probe reproduced the
  error on `localhost` and passed on `127.0.0.1`. The preview URL is now `http://127.0.0.1:<port>/`. Three cold
  builds (no `.cache`) passed after the fix. Details in `reports/docs-build.md`.

Decisions (owner decision 18):

- The inventory check applies to a reference folder once it has a page. Then each page names an export of its
  entry point (by slug in camel case, or in inline code), and each runtime export is named by a page other
  than the index. Exempt: the index pages, `core/extend`, `core/configure`, `core/create`, `behaviors/scope`.
- A heading id not in `heading-ids.json` fails, so the list grows with the pages.
  `--record-heading-ids` adds ids and never removes one.
- "kernel" is a public-docs term only. The glossary keeps it as the contributor word, so `check:terms` allows
  it.
- `check:terms` reads comments and strings in code, and prose in Markdown (no fenced code, inline code or
  link target). "primitive" passes in a paragraph that names UI SDK.
- The index page has the "In short" and "Related" headings of the overview type, so the check passes now.
