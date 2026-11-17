---
id: TK-048
title: Kit forms
phase: 7
work_package: P7-01
status: done
depends_on: [TK-030]
branch: codex/P7-01-kit-forms
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-048: Kit forms

## Outcome

The example kit holds the five domain schemas and the forms of catalogue rows E01 to E03 and E05. Each module has a
passing spec, and the kit type-checks. E01 and E02 use only built-in slot groups.

## Scope

- In: the `example-oxform-kit` workspace content in `examples/kit/src/`: one schema module per domain of
  `04#4.1` (sign-in, checkout, team invites, article editor, member filter), and one module per row E01
  (lean sign-in chain), E02 (member filter with no validation), E03 (checkout with `standard`) and E05 (article editor with `.configure` and `create` options). A sibling `*.spec.ts`
  for each module.
- Out: the `houseForm` preset E04 and the custom extensions and slot groups E06 to E14 (TK-049). The behavior rows E15 to E28 (TK-050). All
  rendering code (TK-051, TK-052, TK-053).

## Read first

- `04-documentation.md#4.1` and `#4.2`: the five domains and the rows E01 to E03 and E05.
- `04-documentation.md#8`: the single-source rule. The kit code is the file that the docs include.
- `02-structure.md#Examples`: the kit layout, its `exports` and its peer.
- `01-public-api.md#3.1` and `#3.2`: the needs of each built-in extension and slot group.
- `01-public-api.md#4`: the `standard` preset.
- `03-testing.md#Deviations and decisions` item 9: the kit specs move with the kit.
- Spike, read only: `explorations/extension-api/kit/lean-form.ts`, `explorations/extension-api/spike/src/kit.spec.ts`
  and `explorations/extension-api/examples/03-validation-and-checks.ts`. Write the code new.

## Decisions to apply

- D36: the catalogue is the 33 rows of `04#4.2` and the five domains of `04#4.1`.
- D37: the kit holds no rendering code. It imports only `@oxform/core` entry points.
- D20 and D54: the built-in slot groups need exactly what they use. `fieldSlots` works with no check.
- D49: a form with no `submit` spreads no root group. Its `Root` renders no element.
- D51: every need is required. Each chain meets every need of its extensions and slot groups.
- D53: a chain with no `validation` uses the stand-in with no checks.

## Acceptance

- [x] Each of E01 to E03 and E05 is one kit module that matches its row of `04#4.2`, with a passing sibling spec.
- [x] E01 and E02 spread only built-in slot groups, and each need of the chain and the groups is met.
- [x] The kit imports no adapter and no spike file. No file is copied from the spike.
- [x] `vp run example-oxform-kit#test` and `vp run example-oxform-kit#check:types` pass.
- [x] `pnpm run test` runs the kit specs. If the root `test` chain does not include the kit, the core track
      adds it in a separate pull request (`06-roadmap.md#Phases`).
- [x] `pnpm run check:all` passes.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. The root `test` runs the kit: 10 specs pass.
  `vp run example-oxform-kit#check:types` passes.
- Modules: `src/schemas/` holds one Zod schema module per domain of `04#4.1` (sign-in, checkout, team invites,
  article, member filter). E01 `sign-in.ts`, E02 `member-filter.ts`, E03 `checkout.ts` and E05
  `article-editor.ts` each have a sibling spec. `services.ts` is the in-memory server of the examples.
- E01 spreads `rootSlots`, `fieldErrorSlots` and `submitSlots`. E02 spreads `fieldSlots` and has no
  `validation` and no `submit`. The type check proves each need of the chains and the groups is met.
- The kit imports only `@oxform/core`, `@oxform/core/behaviors`, `@oxform/core/presets` and `zod` (4.6.7, already
  in the lockfile). No spike file is imported or copied.
- Deviation in E02: the catalogue says "Clear filters" shows while the form is dirty. `dirty` records an
  interaction and does not clear when the value comes back (`docs/form-core-behaviors.md:277`), so the kit
  exports `hasFilters(form)`, which reads the `default` flag of each filter. Reported in
  `reports/extension-api-rebuild.md`.
- E05 configures the validators and the publish call. The `saveDraft` option of the row comes with `autosave`
  (E06, TK-049).
- The schema modules have no spec of their own. The form specs test them.
