---
id: TK-056
title: Comparison workspace
phase: 7
work_package: P7-09
status: todo
depends_on: [TK-054, TK-042, TK-050]
branch: codex/P7-09-comparison-workspace
pr: null
started: null
completed: null
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

- [ ] Every version of each form passes the shared browser test of TK-054.
- [ ] Each version is idiomatic for its library and adds no feature outside the specification.
- [ ] `readme.md` records, for each version, the documentation pages used and the reviewer.
- [ ] `package.json` pins an exact version of each library, of `valibot`, of `@hookform/resolvers` and of
      React. No other workspace imports these libraries.
- [ ] `vp run example-oxform-comparison#test` and `vp run example-oxform-comparison#check:types` pass.
- [ ] `pnpm run test` runs the comparison workspace. If the root `test` chain does not include it, the core
      track adds it in a separate pull request (`06-roadmap.md#Phases`).
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results, the pinned versions and any deviation from the plan here.
