---
id: TK-031
title: Preset flows
phase: 4
work_package: P4-02
status: done
depends_on: [TK-030]
branch: codex/P4-02-preset-flows
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-031: Preset flows

## Outcome

The `standard` preset works end to end from `dist`, through the main, behaviors and presets entry points. A
lean chain gives the same results as the preset for each scenario whose needs it meets. This retires R16.

## Scope

- In: I1 and I9 of `03#Integration layer`, as `tests/*.spec.ts` in the integration project. I1 imports the
  three entries by package name, so they resolve through `exports` to `dist`. The I1 scenarios are tagged with
  the extensions they need. I1 also runs on the chain that the runtime spec of TK-030 writes from the public
  exports. Only the fixtures that I1 and I9 need in `tests/helpers.ts`.
- Out: the preset and its unit and package specs (TK-030). I2, I3, I4 and I6 (TK-032). Coordinate edits of
  `tests/helpers.ts` with TK-032.

## Read first

- `03-testing.md#Integration layer`: the I1 and I9 rows, and the rule for "critical".
- `03-testing.md#Test layers`: the rules for all layers.
- `03-testing.md#CI mapping`: I1 needs a build.
- `06-roadmap.md#Risk register`: R16.
- Spike, read only: `explorations/extension-api/spike/src/standard-form.spec.ts`, `form.spec.ts:96-105` and
  `explorations/extension-api/kit/lean-form.ts`. Write the code new.

## Decisions to apply

- R16: I9 runs each tagged I1 scenario on the lean chain (`values`, `validation`, `check('error')`, `status`,
  `events`, `submit`), with the same expected results as `standard`.

## Acceptance

- [ ] I1 passes from `dist`: define, extend, configure, create, change, blur, validate, submit valid and
      invalid, reset and destroy.
- [x] I1 passes on the chain that is written from the public exports.
- [x] I9 passes for each I1 scenario whose tags the lean chain meets.
- [x] Integration specs import only through the `#core*` barrels or the package name.
- [x] `vp run @oxform/core#test` passes.
- [x] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- Not done, by the owner's decision of 2026-11-16 (behavior tests only): running I1 from `dist` through the
  package names, and on the chain of the deleted runtime spec of TK-030. I1 imports the source barrels `#core`,
  `#core/behaviors` and `#core/presets`.
- `tests/preset-flows.spec.ts`, in the `integration` project (`tests/*.spec.ts`, back in `vite.config.ts` and
  in `test`):
  - I1 on `defineForm(...).extend(standard)`, configured and created like an app: a change writes, marks and
    validates; a blur marks blurred; a submit of invalid values calls `onInvalid` with the issues; a submit of
    valid values calls the configured `onSubmit` with the values and the intent; a reset restores the values,
    the field state, the issues and the form status. Each instance is destroyed at the end of its case.
  - I9: each scenario lists the extensions it needs beyond the lean chain (`values`, `validation`,
    `check('error', { blocking: true, exclusive: true })`, `status`, `events`, `submit`). The lean chain runs
    every scenario except reset, with the same expected results. This retires R16.
- `tests/helpers.ts` gains `requiredAt` and `settled`.
