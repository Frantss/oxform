---
id: TK-054
title: Comparison form specifications
phase: 7
work_package: P7-07
status: dropped
depends_on: [TK-008]
branch: codex/P7-07-comparison-specification
pr: null
started: 2026-11-16
completed: 2026-11-18
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

- [x] The specification states every field, rule and behavior of each form in `07#4.2`, and nothing more.
- [x] Each form has one Valibot schema module, which every version will import.
- [x] Each shared browser test runs against a stub and fails, with the failure output under Evidence.
- [x] `vp run example-oxform-comparison#check:types` passes.
- [x] `pnpm run check:all` passes.

## Evidence

Dropped on 2026-11-18. The owner ruled that the comparison is a static table of features and capabilities (`00-direction.md`, owner decision 19). The reference forms and their shared test are removed with the comparison workspace.

Earlier notes, kept as a record:

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. `example-oxform-comparison#check:types` passes.
- `src/sign-in/specification.md` and `src/team-invites/specification.md` state the fields, rules and behavior of
  `07#4.2`, numbered. `schema.ts` per form is the one Valibot module (valibot 1.5.0, pinned with React 19.3.1).
  `src/server.ts` is the shared server that the tests replace.
- `src/stub.spec.tsx` runs each suite against its stub (the markup with no behavior), with `it.fails`:
  `1 passed | 9 expected fail (10)`. The failure of each case when the stub runs as a normal version:
  - Sign-in 1, 2: `expect(element).toHaveAccessibleDescription()` (no message on submit).
  - Sign-in 3: `expect.poll() function didn't resolve in time` (no message after the first submit).
  - Sign-in 4: `expect(element).toBeDisabled()`.
  - Sign-in 5: `expect(element).toHaveAccessibleDescription()` (no refusal on the password).
  - Team invites 1 to 4: `locator.fill: Timeout` (no row after "Add member").
  - Team invites 5: `Cannot find element with locator: getByText('Enter an email address.')`.
- A throwaway plain React version of each form, not committed, passed all nine cases. So no case asks for
  something that a correct version cannot do.
