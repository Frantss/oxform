---
id: TK-061
title: Main API pages
phase: 8
work_package: P8-04
status: done
depends_on: [TK-050, TK-059]
branch: codex/P8-04-main-api-pages
pr: null
started: 2026-11-18
completed: 2026-11-18
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

- [x] Each export of `@oxform/core` has a page under `core/`, and each page names an export of that entry
      (the inventory check of `04#7.5`).
- [x] Each snippet is an `<include>` of a kit file or a Twoslash block of 25 lines at most, with its imports.
- [x] Each page names a catalogue id that exists in the kit.
- [x] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [x] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [x] `pnpm run check:format` passes.

## Evidence

Commits: `66f41f7` (the 13 `core/*` pages and their heading ids), `98b1c2c` (concept examples, "Common mistakes"
rows, sidebar).

- Inventory: the runtime exports of `@oxform/core` are `createEffect`, `defineExtension`, `defineForm`,
  `defineScope`, `defineSlots`, `get`, `idPart`, `on`, `optionTypes`, `slots` (read from `packages/core/dist`).
  Each has a page by slug or by inline code. `get` and `idPart` are on `core/types`. `docs:check:agents` passes
  (38 pages and 7 templates).
- Snippets: each reference block is Twoslash with its imports, 25 lines at most, or an `<include>` of a kit file
  (`autosave.ts`, `masks.ts`, `form-error-slots.ts` with `twoslash`; `house-form.ts` and the concept includes with
  relative imports with `no-check="checked in the example kit"`). `pnpm run docs:build` passes, so every Twoslash
  block compiles against the built packages.
- Catalogue ids: E01, E04 to E07, E11 to E13, E15, E25, E28 on `core/*`; the concept ids of `04#5`. All exist in
  `examples/kit/src` (E29 in `examples/react/src`). No kit file was added.
- Behavior claims were probed on `packages/core/dist` (node) and with `tsc` in `examples/kit`:
  - A duplicate option name: `.extend` returns `DuplicateOption<"name">` (no form member). Nothing throws.
  - `check('error')` twice: `DuplicateOption<"error">`, and `create` throws `The "check:error" extension declares
    the state key "error", which "check:error" already declares.`
  - `.extend(values).extend(standard)`: no type error. `create` throws `The "values" extension declares the state
    key "values", which "values" already declares.` (not the `check:error` message).
  - A missing need throws `The "status" extension needs "values", which no earlier extension provides.`; a slot
    group need throws `The "g" slot group needs "submit", ...`; an api key `id` throws `... returns "id" from api,
    which the instance has.`; field members without `field` throw; `context.instance()` during `api` throws.
  - `values.set` does not mark `dirty`; `events.change` does. A check after `handles` gives no sugar (TS2339).
  - The six scope messages, the deep merge of scope defaults (scope, `configure`, `create`), and `idPart`
    (`members.0.email` gives `members-0-email`).
- Browser check: `PORT=3204 pnpm run docs:start`, Playwright at 1280x800 and 390x844 on the 13 `core/*` and the 8
  `concepts/*` pages: 42 loads, each 200, no console error or warning, no page error, no hydration message, no
  horizontal overflow, and the concept pages are in the sidebar. Screenshots in the session scratchpad `TK-061/`.
- `pnpm run docs:check:agents`, `pnpm run check:terms`, `pnpm run check:format` and `pnpm run check:all` pass.

Decisions (owner decision 18):

1. `core/option.mdx` keeps its slug from `04#5` and `core/meta.json`, and its title is `optionTypes`, the export
   that D34 put in place of `option`. The page has no descriptor kinds (D34 removed them).
2. The `[scope(path)](/docs/behaviors/scope)` link in `core/meta.json` (`04#5`) is not added: fumadocs lists a
   link item in `llms.txt`, and `docs:check:agents` then fails with "behaviors/scope.mdx is listed 2 times". The
   page is linked from the `core/index` table instead. Fixing it needs a change to the llms index or to the
   check, outside this ticket.
3. `choose-an-api` and `limits` are shown in the sidebar with the concept pages. `04#10` hides step-4 pages until
   step 7 because their "Example" is empty. These two are overview pages with no "Example", and the core pages
   link to them.
4. `core/index` is an overview page (`04#6`: index pages), with the E01 chain as its code.
5. Each "Signature" is a Twoslash declaration made of exported types. `defineExtension` and `defineSlots` show a
   simpler `needs` type, and the page states the difference. `form.extend`, `configure` and `create` are shown as
   members of an interface.
6. The `<F extends AnyForm>` pattern on `core/types` needs a cast (`form.create() as InstanceOf<F>`): in a generic
   body, `create` returns the `AnyForm` instance (TS2322 without it). The page states why.
7. `server-rendering` shows E26 as an inline Twoslash block: `sign-in-page.ts` has no `@oxform/` import, so an
   include of it fails the code-block check.
8. Concept pages with no limit of `04#5.2` (`changes-and-hooks`, `server-rendering`) get "Common mistakes" rows
   from verified behavior.

Deviations and limits: `pnpm run test` was not run (no package, kit or example code changed). `limits.mdx`
(TK-060) states the partial scope default error as "Property 'city' is missing"; `tsc` reports TS2739 "is missing
the following properties". It is not changed here.
