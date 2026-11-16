---
id: TK-029
title: Scopes on checks
phase: 3
work_package: P3-11
status: todo
depends_on: [TK-027, TK-016]
branch: codex/P3-11-scope-checks
pr: null
started: null
completed: null
---

# TK-029: Scopes on checks

## Outcome

A scope definition brings validators that run at each path where it is placed. Their issue paths carry the
prefix. Form and scope validators for one check both run and merge. A validator for an unknown check throws.
One scope view fits a placed scope, a plain object path and an array item.

## Scope

- In: the validator part of `src/main/scopes.ts`, reached only through its symbol keys, and conflict rules 3
  and 4. The rows "Validators run at the path", "Paths are independent", "The view" and "Rule 3 and rule 4" of
  `03#Scopes (defineScope, form.scope)`, in `src/main/scopes.spec.ts`. The `form.scope` cases of the scope row
  of `03#Matrix`.
- Out: defaults and conflict rules 1, 2, 5 and 6 (TK-016). `form.scope(path)` itself and its cache (TK-027).
  Scopes across forms in integration, I4 (TK-032).

## Read first

- `01-public-api.md#2.3`: the `defineScope` contract.
- `02-structure.md#Source tree`: what `main/scopes.ts` holds, and the rule that `form.ts` never imports it.
- `03-testing.md#Scopes (defineScope, form.scope)` and the scope row of `#Matrix`.
- `explorations/extension-api/readme.md`: the six conflict rules (`XR:197-202` in `03`).
- Spike, read only: `explorations/extension-api/spike/src/scopes.ts` and `scopes.spec.ts`. Write the code new.

## Decisions to apply

- No row of the decision register or of `01#9` belongs to this module. Apply rules 3 and 4 as the readme
  states them: both validators run and merge, and an unknown check throws.

## Acceptance

- [ ] Each row of `03#Scopes (defineScope, form.scope)` that this ticket owns has a passing test.
- [ ] A form without scopes does not load `main/scopes.ts`.
- [ ] Each export that this ticket changes has a positive and a negative type case in `tests/types/`.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.
