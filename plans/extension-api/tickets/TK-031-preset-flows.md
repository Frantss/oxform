---
id: TK-031
title: Preset flows
phase: 4
work_package: P4-02
status: todo
depends_on: [TK-030]
branch: codex/P4-02-preset-flows
pr: null
started: null
completed: null
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
- [ ] I1 passes on the chain that is written from the public exports.
- [ ] I9 passes for each I1 scenario whose tags the lean chain meets.
- [ ] Integration specs import only through the `#core*` barrels or the package name.
- [ ] `vp run @oxform/core#test` passes.
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Record the command results, how the integration project resolves `dist`, and any deviation from the plan here.
