---
id: TK-068
title: Comparison page
phase: 8
work_package: P8-11
status: todo
depends_on: [TK-055, TK-057, TK-059]
branch: codex/P8-11-comparison-page
pr: null
started: null
completed: null
---

# TK-068: Comparison page

## Outcome

`comparison.mdx` shows the feature matrix and the size tables of Oxform, TanStack Form, React Hook Form and
Formisch, generated from the committed result files. The `.md` route holds both tables. `/comparison.json`
serves the data. A stale data set shows a warning on the page.

## Scope

- In: `comparison.mdx` with the H2 headings of `07-comparison.md#5`, on the overview type. The script that
  writes both tables as Markdown from `examples/comparison/results/size.json` and
  `examples/comparison/features.json`. The static `/comparison.json`, linked from the page and from `llms.txt`.
  The warning block of the staleness rule of `07#6.2`, which the docs build prints with no network call. The
  "Comparison correction" issue template of `07#4.6` rule 6.
- Out: the comparison workspace and its measurement (TK-056, TK-057). The research data (TK-055).
  `compare:check` in `prepublish` (TK-069).

## Read first

- `07-comparison.md#5`: the headings, the outputs and the table generation.
- `07-comparison.md#4.5`: the stamp line under each size table.
- `07-comparison.md#4.6`: the fairness rules and the correction path.
- `07-comparison.md#6.2`: the staleness rule.
- `07-comparison.md#6.3`: the P8-11 row.
- `04-documentation.md#5`: the `comparison.mdx` row of the "Start" table.
- `04-documentation.md#6`: the overview template.

## Decisions to apply

- D50: show two forms (Sign-in and Team invites), React only, and no render counts.

## Acceptance

- [ ] The `.md` route of the page has both tables, with version and date columns.
- [ ] `/comparison.json` holds both result files and is linked from the page and from `llms.txt`.
- [ ] An old `measuredAt` makes `pnpm run docs:build` print the warning block on the page.
- [ ] Each matrix cell has a source link.
- [ ] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [ ] The page and its tables work at desktop and mobile sizes. The console shows no runtime, SSR or hydration
      error (`AGENTS.md`, "Validation").
- [ ] `pnpm run check:format` passes.

## Evidence

Record the command results and the browser check here. Try a Markdown include of a generated file first. If
Fumadocs puts it in the page and in the `.md` route, use the include and remove the markers. Else the script
rewrites the block between two markers in `comparison.mdx` (`07#5`). Record which path was taken.
