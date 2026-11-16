---
id: TK-032
title: Cross-extension flows
phase: 4
work_package: P4-03
status: done
depends_on: [TK-029]
branch: codex/P4-03-cross-extension-flows
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-032: Cross-extension flows

## Outcome

Flows that cross two or more extensions pass in Node: validation lanes and races, custom extensions on a form,
scopes, and a request handler that shares no state between two requests.

## Scope

- In: I2, I3, I4 and I6 of `03#Integration layer`, as `tests/*.spec.ts` in the integration project. I3 uses
  test-local extensions, not the kit. Only the fixtures that these flows need in `tests/helpers.ts`.
- Out: I1 and I9 (TK-031). I5 and I7 (phase 5). I8 (TK-051). Coordinate edits of `tests/helpers.ts` with
  TK-031.

## Read first

- `03-testing.md#Integration layer`: the I2, I3, I4 and I6 rows, and the rule for "critical".
- `03-testing.md#Test layers`: the rules for all layers.
- `03-testing.md#Deviations and decisions`: item 9 (I3 does not use the kit).
- Spike, read only: `explorations/extension-api/spike/src/validation-lanes.spec.ts`, `submit.spec.ts`,
  `extension.spec.ts`, `extension-hooks.spec.ts`, `kit.spec.ts`, `scopes.spec.ts`, `field-extras.spec.ts` and
  `inert-api.spec.ts`. Write the code new.

## Decisions to apply

- No row of the decision register or of `01#9` belongs to this ticket. Each flow asserts the behavior that the
  unit tickets of phase 3 apply.

## Acceptance

- [x] I2 passes: change during a run, newer run, reset during a run, change during submit, reset during submit,
      two checks pending.
- [x] I3 passes: a test-local extension with an option, state, api, slot, field members and extension hooks;
      two extensions in both orders; destroy cleans up.
- [x] I4 passes: one scope definition at two paths and in two forms, field members on nested scopes,
      independent validation and reset.
- [x] I6 passes: validate a body, render the errors from the same instance, two concurrent requests share
      nothing.
- [x] Integration specs import only through the `#core*` barrels.
- [x] `vp run @oxform/core#test` passes.
- [x] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- All four flows run on `standard`, import only `#core`, `#core/adapter` and `#core/presets`, and are in the
  `integration` project.
- I2, `tests/validation-races.spec.ts`: a change during a run drops it; the newer of two runs of one lane wins;
  a reset during a run drops it; a change and a reset during submit abort it with no callback, and the reset
  status stays; `validating` stays true until the last of two pending checks settles.
- I3, `tests/custom-extensions.spec.ts`: a test-local extension with an option, state, api, slot, field members
  and a submit hook; two extensions run their hooks in the order applied, in both orders; destroy runs the
  cleanup and stops the listener.
- I4, `tests/scopes.spec.ts`: one definition at two paths and in two forms validates each path on its own;
  `reset.at` of one path keeps the other; field members on a nested scope.
- I6, `tests/request-handler.spec.ts`: a module-level form validates a body and renders the errors from the
  same instance through the `fieldError` slot; two concurrent requests share nothing.
- Bug found by I2 and fixed in its own commit: `reset.all()` on values that were already the defaults wrote
  nothing, so a pending run was not discarded, and its issues arrived after the reset. The validation link has
  `discard(path?)`, and `reset.all` and `reset.at` call it. Two unit cases in `reset.spec.ts` fail without the
  fix.
- `tests/helpers.ts` gains `deferred`.
