---
id: TK-063
title: Compose and extend guides
phase: 8
work_package: P8-06
status: todo
depends_on: [TK-050, TK-059, TK-033]
branch: codex/P8-06-compose-extend-guides
pr: null
started: null
completed: null
---

# TK-063: Compose and extend guides

## Outcome

A reader can build a lean form, a form without validation, a preset, a slot group and a scope with the
`compose/` guides, and can write, test and share an extension with the `extend/` guides. Each guide holds the
complete kit file of its example.

## Scope

- In: the core part of the 8 `compose/*` pages and the 10 `extend/*` pages of `04-documentation.md#5`, on the
  guide template. The measured size of each tier on `compose/index.mdx`. The table of extension hooks on
  `extend/index.mdx`. The "Common mistakes" rows of `04#5.2` and the authoring frictions that stay
  (`04#5.2`, last paragraph) for these pages.
- Out: the rendering part of the guides, such as E31 and E33 (TK-064). Solid tabs (TK-065). `core/*` (TK-061).
  `behaviors/*` (TK-062). If the review is too large, split this ticket by folder
  (`06-roadmap.md#Deviations and decisions` 8).

## Read first

- `04-documentation.md#4.2`: the catalogue rows E01 to E28 that the guides use.
- `04-documentation.md#5`: the `compose/` and `extend/` tables.
- `04-documentation.md#5.2`: the limits and the authoring frictions.
- `04-documentation.md#6`: the guide template.
- `04-documentation.md#7.3` and `#8`: the page rules and the snippet policy.
- `04-documentation.md#11`: decision 13, the complete file of each copied extension.
- `01-public-api.md#2.3`, `#3.1` and `#7.5`: the extension hooks, the needs and the frictions.
- `03-testing.md#Size report`: the measured sizes.

## Decisions to apply

- None in the register. Show no internal `createX` function (`04#11` decision 2).

## Acceptance

- [ ] Each guide has the fixed headings of the guide template, in order.
- [ ] The "Complete example" of each guide is an `<include>` of the kit file of its catalogue row.
- [ ] Each page names a catalogue id that exists in the kit.
- [ ] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [ ] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [ ] `pnpm run check:format` passes.

## Evidence

Record the command results, the browser check and any deviation from the plan here.
