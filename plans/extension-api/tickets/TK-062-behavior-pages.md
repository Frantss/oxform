---
id: TK-062
title: Behavior and preset pages
phase: 8
work_package: P8-05
status: done
depends_on: [TK-050, TK-059, TK-033]
branch: codex/P8-05-behavior-pages
pr: null
started: 2026-11-18
completed: 2026-11-18
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

- [x] The pages of `behaviors/` and `presets/` match the export inventory of `@oxform/core/behaviors` and
      `@oxform/core/presets` (the inventory check of `04#7.5`).
- [x] Each "Needs" table lists each need as required, with its runtime error at `create`.
- [x] Each page names a catalogue id that exists in the kit.
- [x] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [x] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [x] `pnpm run check:format` passes.

## Evidence

Pages: `apps/docs/content/docs/behaviors/{index,values,validation,check,status,events,arrays,reset,submit,handles,scope,slot-groups}.mdx`
and `apps/docs/content/docs/presets/standard.mdx`. Heading ids recorded in `apps/docs/scripts/heading-ids.json`
(additions only).

- Inventory: `pnpm run docs:check:agents` passes ("14 pages and 7 templates pass"). Its inventory rule finds a page
  or an inline-code name for each runtime export of `@oxform/core/behaviors` (9 extensions, 5 slot groups) and of
  `@oxform/core/presets` (`standard`). `behaviors/scope` is exempt, as `04#3` states.
- Needs: each "Needs" table marks each need "Required: Yes" and gives its error at `create`. The text of each error
  comes from a probe of `packages/core/dist`: each extension and each slot group was created with every need but one,
  given by a stub extension (17 extension needs, 12 slot group needs). Each probe threw the message on the page.
- Catalogue: each page names ids that exist in `examples/kit/src` (E01, E03, E09, E10, E11, E12, E14, E16, E17, E18,
  E19, E20, E21, E22, E23, E24, E08). No new kit file was needed. The check "catalogue" rule passes.
- `pnpm run docs:build` passes. Every `ts` block is `twoslash`. The kit files of E08, E09, E10 and E11 are included
  with `<include meta="twoslash">`, and the build type-checks them. Each type error in "Common mistakes" comes from
  `// @errors` (2769, 2339, 2345).
- Browser: production server on port 3202, Playwright, 1280x800 and 390x844, 13 pages: status 200, no console
  error or warning, no page error, no hydration warning, no horizontal page overflow.
- `pnpm run check:terms`, `pnpm run check:format` and `pnpm run check:all` pass.

Deviations and decisions (owner decision 18):

- The size of the preset is left out of `presets/standard.mdx`: TK-033 (size report) is dropped, so no measured size
  exists.
- "Use from an extension" shows a catalogue extension where one needs the behavior: `normalizeEmail` (values),
  `funnel` (validation), `confirmExternal` (submit), `masks` (handles). For `check`, `status`, `events`, `arrays`
  and `reset`, no catalogue extension needs the behavior, so the section states the `Needs` name, the `deps` members
  and the hooks in prose, with no invented example. `slot-groups` and `presets/standard` omit the optional heading.
- `behaviors/index.mdx` is an overview page. The limit "every need is required" is its own section, because an
  overview page has no "Common mistakes" heading.
- Rendering stays at core level: slot names, elements, props, slot state and attributes. No framework code.
- Related links point only to pages that exist on this branch (`behaviors/`, `presets/`), because the prerender of
  `docs:build` fails on a dead link.
- The limit "a slot writes `text` after `state`" is a "Common mistakes" row of `behaviors/slot-groups`, with its
  Twoslash error.
- A duplicate check name throws at `create` with the duplicate state key message, and `check.mdx` states it. At
  runtime `.extend` does not throw on a duplicate option, against `04#5.2` ("A duplicate option name throws at
  `.extend`"). In the types, the result of that `.extend` has no form member (`packages/core/src/main/types.ts:25`).
  Reported to the coordinator for TK-061 (`core/extend`). `.extend(values).extend(standard)` is no type error and
  throws at `create`; `presets/standard.mdx` states that message.
