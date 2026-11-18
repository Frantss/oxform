---
id: TK-056
title: Comparison workspace
phase: 7
work_package: P7-09
status: done
depends_on: [TK-054, TK-042, TK-050]
branch: codex/P7-09-comparison-workspace
pr: null
started: 2026-11-16
completed: 2026-11-18
---

# TK-056: Comparison workspace

## Outcome

`examples/comparison` holds each reference form written with Oxform, TanStack Form, React Hook Form and
Formisch in React. Every version passes the shared browser test of its form.

## Scope

- In: the versions of Sign-in and Team invites for each library, with Oxform in its two rows of `07#4.4`
  (lean chain and `standard`). Exact pinned versions in `examples/comparison/package.json`. The review
  `readme.md` beside the code.
- Out: the specification, the schemas and the shared tests (TK-054). `features.json` (TK-055).
  `compare:size`, `compare:check` and `results/size.json` (TK-057).

## Read first

- `07-comparison.md#4.2`: the two forms.
- `07-comparison.md#4.4`: Oxform's two rows per form.
- `07-comparison.md#4.5`: what `package.json` pins.
- `07-comparison.md#4.6`: the fairness rules.
- `07-comparison.md#7`: risks 2, 3 and 6.
- `02-structure.md#Comparison workspace`: the other libraries reach no other workspace.

## Decisions to apply

- D50: two forms, React only, no render counts.

## Acceptance

- [x] Every version of each form passes the shared browser test of TK-054.
- [x] Each version is idiomatic for its library and adds no feature outside the specification.
- [x] `readme.md` records, for each version, the documentation pages used and the reviewer.
- [x] `package.json` pins an exact version of each library, of `valibot`, of `@hookform/resolvers` and of
      React. No other workspace imports these libraries.
- [x] `vp run example-oxform-comparison#test` and `vp run example-oxform-comparison#check:types` pass.
- [x] `pnpm run test` runs the comparison workspace. If the root `test` chain does not include it, the core
      track adds it in a separate pull request (`06-roadmap.md#Phases`).
- [x] `pnpm run check:all` passes.

## Evidence

Record the command results, the pinned versions and any deviation from the plan here.

- Pinned: `@formisch/react` 1.2.0, `@hookform/resolvers` 7.0.6, `@tanstack/react-form` 1.33.5,
  `react-hook-form` 7.92.0, `react` and `react-dom` 19.3.1, `valibot` 1.5.0. On 2026-11-18 each is `latest`
  except `@hookform/resolvers`. No workspace outside `examples/comparison` imports these libraries.
- Open: `@hookform/resolvers` 7.0.7 is `latest` (published 2026-11-17). The pin stays at 7.0.6, which
  `features.json` cites.
- `vp run example-oxform-comparison#check:types`: exit 0. `pnpm run check:all`: exit 0.
- `vp run example-oxform-comparison#test`: exit 0. 46 passed, 9 expected fail (the stub cases). Every case of
  both forms passes for all five versions.
- `pnpm run test`: exit 0. The chain ends with `example-oxform-comparison#test` (46 passed, 9 expected fail).
- Deviation in `team-invites/suite.tsx` case 4: each submit is Enter from the email field, not a click. A click
  blurs the field, and the blur lookup changed a message above the button between `mousedown` and `mouseup`,
  so no `click` or `submit` fired (event log: `down:Send invites`, `up:P:This address is alre`, `click:FORM`).
  With Enter there is no blur, so the lookup message comes from the submit (rule 4).
- `team-invites/specification.md` rule 1 states that "Move up" is disabled on the first row. Without it,
  `move(0, -1)` corrupts the order in React Hook Form (`moveArrayAt` splices at `-1`).
- `team-invites/schema.ts` adds `teamInvitesLookupSchema`, the submit and blur rules of both Oxform rows.
- Sign-in in Oxform adds the extension `revalidateAfterSubmit`: Oxform has no option to validate on change after
  the first submit.
