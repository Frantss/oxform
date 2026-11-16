---
id: TK-032
title: Cross-extension flows
phase: 4
work_package: P4-03
status: todo
depends_on: [TK-029]
branch: codex/P4-03-cross-extension-flows
pr: null
started: null
completed: null
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

- [ ] I2 passes: change during a run, newer run, reset during a run, change during submit, reset during submit,
      two checks pending.
- [ ] I3 passes: a test-local extension with an option, state, api, slot, field members and extension hooks;
      two extensions in both orders; destroy cleans up.
- [ ] I4 passes: one scope definition at two paths and in two forms, field members on nested scopes,
      independent validation and reset.
- [ ] I6 passes: validate a body, render the errors from the same instance, two concurrent requests share
      nothing.
- [ ] Integration specs import only through the `#core*` barrels.
- [ ] `vp run @oxform/core#test` passes.
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Record the command results and any deviation from the plan here.
