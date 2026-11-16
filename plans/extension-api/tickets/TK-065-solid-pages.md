---
id: TK-065
title: Solid pages
phase: 8
work_package: P8-08
status: todo
depends_on: [TK-052, TK-053, TK-059]
branch: codex/P8-08-solid-pages
pr: null
started: null
completed: null
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

- [ ] Each rendering snippet has the tabs `React`, `Solid 1` and `Solid 2`, and the Markdown form keeps the
      titles.
- [ ] Each difference on the Solid pages is a row of `01#6.3`.
- [ ] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [ ] The pages and the tabs work at desktop and mobile sizes. The console shows no runtime, SSR or hydration
      error (`AGENTS.md`, "Validation").
- [ ] `pnpm run check:format` passes.

## Evidence

Record the command results, the browser check and any deviation from the plan here.
