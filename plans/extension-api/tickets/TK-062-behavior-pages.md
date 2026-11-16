---
id: TK-062
title: Behavior and preset pages
phase: 8
work_package: P8-05
status: todo
depends_on: [TK-050, TK-059, TK-033]
branch: codex/P8-05-behavior-pages
pr: null
started: null
completed: null
---

# TK-062: Behavior and preset pages

## Outcome

Each built-in extension, the slot groups, `scope(path)` and the `standard` preset have a page on the extension
template. The `behaviors/` and `presets/` folders match the export inventory of their entry points.

## Scope

- In: the 12 `behaviors/*` pages and `presets/standard.mdx` of `04-documentation.md#5`. The table of
  `behaviors/index.mdx` in the order that `standard` applies the extensions. The "Use from an extension"
  section of each behavior page. The size of the preset on `presets/standard.mdx`, from the size report. The
  "Common mistakes" rows of `04#5.2` for these pages.
- Out: `core/*` (TK-061). `compose/slot-group` and the other guides (TK-063). Rendering snippets (TK-064,
  TK-065). If the review is too large, split this ticket by folder (`06-roadmap.md#Deviations and decisions`
  8).

## Read first

- `04-documentation.md#3`: the export-inventory check, and why `behaviors/scope` is exempt.
- `04-documentation.md#5`: the `behaviors/` and `presets/` tables.
- `04-documentation.md#5.2`: the limits stated on these pages.
- `04-documentation.md#6`: the extension template and the rule for "Use from an extension".
- `04-documentation.md#7.3` and `#8`: the page rules and the snippet policy.
- `01-public-api.md#3.1`, `#3.2`, `#3.3` and `#4`: the extensions, their needs, the slot groups and the preset.
- `03-testing.md#Size report`: where the measured sizes are.

## Decisions to apply

- None in the register. Show no internal `createX` function: "Use from an extension" shows a custom extension
  that needs the behavior (`04#11` decision 2).

## Acceptance

- [ ] The pages of `behaviors/` and `presets/` match the export inventory of `@oxform/core/behaviors` and
      `@oxform/core/presets` (the inventory check of `04#7.5`).
- [ ] Each "Needs" table lists each need as required, with its runtime error at `create`.
- [ ] Each page names a catalogue id that exists in the kit.
- [ ] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [ ] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [ ] `pnpm run check:format` passes.

## Evidence

Record the command results, the browser check and any deviation from the plan here.
