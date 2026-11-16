---
id: TK-061
title: Main API pages
phase: 8
work_package: P8-04
status: todo
depends_on: [TK-050, TK-059]
branch: codex/P8-04-main-api-pages
pr: null
started: null
completed: null
---

# TK-061: Main API pages

## Outcome

Each export of `@oxform/core` has a reference page under `core/`, with type-checked snippets from the example
kit. Each concept page has its example and shows in the sidebar.

## Scope

- In: the 13 `core/*` pages of `04-documentation.md#5`, on the reference template. The "Example" section of
  each `concepts/*` page, and the removal of their sidebar hiding (`04#10`, rules). The "Common mistakes" rows
  of `04#5.2` for these pages. The three "any instance" patterns on `core/types.mdx`.
- Out: the concept text (TK-060). `behaviors/*`, including `behaviors/scope`, and `presets/standard` (TK-062).
  `compose/*` and `extend/*` (TK-063). Rendering snippets and framework tabs (TK-064, TK-065). If the review is
  too large, split this ticket by folder (`06-roadmap.md#Deviations and decisions` 8).

## Read first

- `04-documentation.md#3`: the export-inventory check and its exempt pages.
- `04-documentation.md#4.2`: the catalogue rows that the pages use.
- `04-documentation.md#5`: the `core/` and `concepts/` tables.
- `04-documentation.md#5.2`: the limits stated on these pages.
- `04-documentation.md#6`, `#7.3` and `#8`: the templates, the page rules and the snippet policy.
- `01-public-api.md#2.1`, `#2.2`, `#2.3` and `#7.7`: the exports, their contracts and the "any instance"
  patterns.

## Decisions to apply

- D45: add no `AnyInstance` type. Document the three patterns of `01#7.7`.

## Acceptance

- [ ] Each export of `@oxform/core` has a page under `core/`, and each page names an export of that entry
      (the inventory check of `04#7.5`).
- [ ] Each snippet is an `<include>` of a kit file or a Twoslash block of 25 lines at most, with its imports.
- [ ] Each page names a catalogue id that exists in the kit.
- [ ] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [ ] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [ ] `pnpm run check:format` passes.

## Evidence

Record the command results, the browser check and any deviation from the plan here.
