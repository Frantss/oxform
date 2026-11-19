---
id: TK-065
title: Solid pages
phase: 8
work_package: P8-08
status: done
depends_on: [TK-052, TK-053, TK-059]
branch: codex/P8-08-solid-pages
pr: null
started: 2026-11-18
completed: 2026-11-18
---

# TK-065: Solid pages

## Outcome

A Solid 1 or Solid 2 reader has an adapter page, and every rendering snippet has a `Solid 1` and a `Solid 2`
tab beside `React`.

## Scope

- In: `adapters/solid.mdx` and `adapters/solid-v2.mdx` of `04-documentation.md#5`, on the adapter template.
  The `Solid 1` and `Solid 2` tabs on each rendering snippet of TK-064. Solid 1 blocks use
  `// @jsxImportSource solid-js`. Solid 2 blocks are included from `examples/solid-v2` and carry a `no-check`
  reason. The "Differences" section lists the rows of `01-public-api.md#6.3`.
- Out: `adapters/index`, `adapters/react` and the React tabs (TK-064). The Solid rows of the migration guide
  (TK-066).

## Read first

- `04-documentation.md#5`: the `adapters/` rows.
- `04-documentation.md#6`: the adapter template.
- `04-documentation.md#7.3`: rules 4 and 11.
- `04-documentation.md#8`: the Solid snippet policy.
- `04-documentation.md#10`: step 9.
- `04-documentation.md#11`: decision 9, Solid 2 snippets.
- `01-public-api.md#6.3` and `#6.4`: the Solid surface and the parity rules.

## Decisions to apply

- None in the register. Include Solid 2 snippets from `examples/solid-v2` (`04#11` decision 9).

## Acceptance

- [x] Each rendering snippet has the tabs `React`, `Solid 1` and `Solid 2`, and the Markdown form keeps the
      titles.
- [x] Each difference on the Solid pages is a row of `01#6.3`.
- [x] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [x] The pages and the tabs work at desktop and mobile sizes. The console shows no runtime, SSR or hydration
      error (`AGENTS.md`, "Validation").
- [x] `pnpm run check:format` passes.

## Evidence

- Pages: `adapters/solid.mdx` and `adapters/solid-v2.mdx` on the adapter template; `adapters/index.mdx` links them.
- Tabs: all 26 tab groups with a `React` tab (20 pages: quick start, `adapters/index`, `adapters/react`, the nine
  recipes, and the rendering steps of `compose/` and `extend/`) now have `React`, `Solid 1` and `Solid 2`. The
  Solid 1 tab includes `examples/solid` (`no-check="checked in the Solid 1 example"`), the Solid 2 tab includes
  `examples/solid-v2` (`no-check="solid 2 types, checked in the Solid 2 example"`). The prerendered `.md` keeps the
  three `<Tab value=…>` titles (`dist/client/docs/quick-start.md:74-174`).
- Examples: as in TK-064 decision 2, every Solid 1 and Solid 2 example file calls `createParts` itself, and the
  `*-form.ts` files export only the form. New files: `region-select.tsx` (E21), `article-actions.tsx` (E22, E23,
  E25), `sign-in-server.tsx` (E27), and `SignInFields` with `method='post'` in `sign-in.tsx`. E27 renders with
  `renderToString` of `solid-js/web` and of `@solidjs/web`. It is tested in Node with the server build of Solid
  (`vite.ssr.config.ts`, `tests/server/sign-in-server.spec.ts`); the browser config excludes `tests/server`, and
  the `test` script runs both. A server-render counterpart fits Solid 2, so no tab has a "does not fit" reason.
- Differences: the Solid 1 table has the 16 rows of `01#6.3` with the Solid 1 values. The Solid 2 page lists the
  two rows with a Solid 2 value of their own (`Root` options, boolean `aria-*`) and refers to the Solid 1 table for
  the rest. Each row was checked in `packages/solid-v1/src` and `packages/solid-v2/src` (`hooks.ts`,
  `part-view.ts`, `create-parts.ts`, `types.ts`) and in `packages/solid/dist` (no `'use client'`).
- Commands (worktree root): `pnpm run build` passed; `pnpm run docs:build` passed; `pnpm run docs:check:agents`:
  72 pages and 7 templates pass; `pnpm run check:terms`: no forbidden term in 274 files; `pnpm run check:format`:
  all files formatted; `pnpm run check:all` passed; `pnpm run test` passed (Solid 1 example 19 browser + 2 server
  tests, Solid 2 example 38 browser + 2 server tests).
- Browser (production server, port 3209, 1280x800 and 390x844): `adapters/solid`, `adapters/solid-v2`, quick
  start, `adapters/index`, `adapters/react`, `recipes/dependent-fields`, `compose/array-rows`,
  `extend/write-an-extension`. Choosing `Solid 1` selects it in every group of the page, the panels show the
  `@oxform/solid` and `@oxform/solid/v2` sources, and the choice holds on the next page
  (`recipes/another-element`). No horizontal overflow. Playground Solid 1 and Solid 2 for checkout, article editor
  and sign-in: the form renders, and the source list shows `region-select.tsx` and `article-actions.tsx`. No
  console error, page error or hydration warning. Screenshots: the scratchpad folder `TK-065`.
- Decisions (owner decision 18):
  1. `adapters/react.mdx` also gets the Solid tabs: the TASK names every group with a `React` tab, and the tabs sync
     by `groupId`. Its prose is unchanged.
  2. The Solid 1 inline Twoslash block on `adapters/solid` has no JSX, so it has no `// @jsxImportSource solid-js`.
     A JSX block fails in the docs app: the built `@oxform/solid` resolves the `solid-js` 2 types of its workspace
     dev dependency, and every part element becomes `never` (the finding "In the workspace, `@oxform/solid`
     types resolve the Solid 2 of its dev dependencies" of `reports/extension-api-rebuild.md`). The included Solid 1 blocks carry `no-check`, as the React ones do.
  3. The Solid 2 page keeps every fixed heading, and points to the Solid 1 sections where the behavior is the
     same, so each fact is in one place.
  4. The playground list needs no change: it already names `region-select.tsx` and `article-actions.tsx`.
