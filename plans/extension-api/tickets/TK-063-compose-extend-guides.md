---
id: TK-063
title: Compose and extend guides
phase: 8
work_package: P8-06
status: done
depends_on: [TK-050, TK-059, TK-033]
branch: codex/P8-06-compose-extend-guides
pr: null
started: 2026-11-18
completed: 2026-11-18
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

- [x] Each guide has the fixed headings of the guide template, in order.
- [x] The "Complete example" of each guide is an `<include>` of the kit file of its catalogue row.
- [x] Each page names a catalogue id that exists in the kit.
- [x] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [x] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [x] `pnpm run check:format` passes.

## Evidence

- Pages: the core part of the 8 `compose/*` and 10 `extend/*` pages of `04#5`. The 16 guides use the guide
  template with its fixed H2 headings in order. `compose/index` and `extend/index` are index pages, so they use the
  overview template (`04#6`: "index pages"). Each "Complete example" is an `<include>` of the kit file of its row:
  E01 `sign-in.ts`, E02 `member-filter.ts`, E03 `checkout.ts`, E04 `house-form.ts`, E12 `form-error-slots.ts`,
  E15 `address.ts`, E16 `member-row.ts` and E17 `member-list.ts`, E06 and E07 `autosave.ts`, E08
  `normalize-email.ts`, E09 `funnel.ts`, E10 `confirm-external.ts`, E11 `masks.ts`, E14 `warnings.ts`, E13
  `strict-submit-slots.ts`, E28 `draft-form.ts`. A file with relative imports uses
  `meta='no-check="checked in the example kit"'`; the others use `meta="twoslash"`. No new kit file was needed.
- Extension hooks on `extend/index`: `values.intercept`, `values.onChange` (`packages/core/src/behaviors/values.ts:22-23`,
  `change.ts:37-38`), `validation.onRun` (`validation.ts:47`), `submit.intercept` and `submit.onResult`
  (`submit.ts:29-31`). No other built-in api has a subscription point.
- Frictions, checked against the built package with probes in the kit (removed after use):
  - A generic preset that adds an option: `form.extend(standard).extend(check('warning'))` is the undecided
    `DuplicateOption` conditional, and the next `.extend` is TS2339. Stated on `compose/your-own-preset` (with an
    `// @errors: 2339` block) and `extend/second-check`. `standard` casts (`packages/core/src/presets/standard.ts`).
  - A slot with `text` before `state` gets the state `{}` (TS2339 on its member). Stated on `compose/slot-group`,
    `extend/write-an-extension` and `extend/second-check`.
  - An extension named by a parameter: `check` now has two casts (`behaviors/check.ts:143-149`), not three.
  - A state that starts with `null` needs a return type (TS2322 without it). Stated on `extend/write-an-extension`.
  - `change.path` in a generic extension needs no cast now: `Partial<Record<Path<Values>, string>>` indexes it.
    So no page states that limit. Finding in `reports/extension-api-rebuild.md` (the `masks.ts:28` comment).
  - Missing need: TS2769, "The last overload gave the following error", whose last line names the missing needs.
    `extend/write-an-extension` shows it with `// @errors: 2769`.
- Runtime messages in "Common mistakes" come from a Node probe on the built package: duplicate state key, slot
  group need, field members without `field`, duplicate api key, base member, duplicate check.
- Each step block that imports kit files (`no-check="imports files of the example kit"`) was compiled in the kit
  with `tsc`, with the import paths moved, and passed.
- Rendering blocks for TK-064 and TK-065: `compose/repeated-block` (E31, `useScope` and the `scope` prop) and
  `compose/array-rows` (E33, `useArray`) end their Steps with the core part, so a "Render ..." step with a `React`
  tab block goes last in Steps. The same place fits an optional render step on `compose/lean-form` (E29),
  `compose/form-without-validation` (a `Root` with no element), `compose/slot-group` (`formError`),
  `extend/write-an-extension` (`autosaveStatus`), `extend/second-check` (`fieldWarning`) and
  `extend/replace-a-slot` (`Submit`). No page has placeholder text.
- Commands, from the worktree root after the rebase onto `b378961` (with `0aaf879`): `pnpm run build` 12/12,
  `pnpm run docs:build` passed, `pnpm run docs:check:agents` "43 pages and 7 templates pass",
  `pnpm run check:terms` "no forbidden term in 262 files", `pnpm run check:format` passed, `pnpm run check:all`
  passed, `pnpm run test` passed (kit: 27 files, 66 tests).
- Browser: `PORT=3203 pnpm run docs:start`, Playwright on the 18 pages at 1280x800 and 390x844: status 200, no
  console error or warning, no page error, no hydration warning, no horizontal overflow. Screenshots in the
  session scratchpad (`tk-063/`). `/docs/compose/lean-form.md` holds the full included kit file.

Deviations and decisions (owner decision 18):

- `compose/index` has no measured sizes: TK-033 is dropped. The ladder is kept; `standard-preset` states the cost
  as "loads all nine extensions and four slot groups", with no number.
- Links go only to pages that exist on integration (`compose/`, `extend/`, `behaviors/`, `presets/`,
  `concepts/`). The prerender crawl fails `docs:build` on a dead link, so no page links `core/*` (TK-061). TK-061
  can add those links to the "Related" lists.
- "Common mistakes" rows that are type errors state the effect in the table. The main ones also have an
  `// @errors` block, so Twoslash proves the error code.
- The test step of `extend/test-and-share` imports `vitest`; the kit runs the same test through `vite-plus/test`.
  The page says so.
- The publish step shows `"@oxform/core": "^0.7.0"`, the release these docs describe.
