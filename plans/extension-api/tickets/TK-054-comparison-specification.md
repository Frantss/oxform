---
id: TK-054
title: Comparison form specifications
phase: 7
work_package: P7-07
status: todo
depends_on: [TK-008]
branch: codex/P7-07-comparison-specification
pr: null
started: null
completed: null
---

# TK-054: Comparison form specifications

## Outcome

`examples/comparison` holds the written specification of the Sign-in and Team invites forms, one shared
Valibot schema module per form, and one shared browser test per form. Each test runs against a stub and
fails.

## Scope

- In: the written specification of each form (fields, rules, behavior), the two schema modules, the two
  shared browser tests and the stub that they fail on, in `examples/comparison`.
- Out: the versions of each form for each library (TK-056). The research and `features.json` (TK-055). The
  measurement scripts (TK-057).

## Read first

- `07-comparison.md#4.2`: the two reference forms and the shared Valibot schema.
- `07-comparison.md#4.6`: fairness rules 2 and 3. The test is the specification.
- `07-comparison.md#6.3`: the scope of P7-07.
- `02-structure.md#Comparison workspace`: the workspace, its name and what is shared.
- `03-testing.md#Size report`: the shared test is not an I8 flow and does not count toward coverage.
- `04-documentation.md#4.2`: E01, E18 and E19, which the specification follows.

## Decisions to apply

- D50: two forms, Sign-in and Team invites, React only, no render counts.

## Acceptance

- [ ] The specification states every field, rule and behavior of each form in `07#4.2`, and nothing more.
- [ ] Each form has one Valibot schema module, which every version will import.
- [ ] Each shared browser test runs against a stub and fails, with the failure output under Evidence.
- [ ] `vp run example-oxform-comparison#check:types` passes.
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results, the path of the written specification and any deviation from the plan here.
