---
id: TK-043
title: Solid 1 risk probe
phase: 6
work_package: P6-01
status: todo
depends_on: [TK-036, TK-037]
branch: codex/P6-01-solid-risk-probe
pr: null
started: null
completed: null
---

# TK-043: Solid 1 risk probe

## Outcome

A minimal `createParts` in Solid 1 renders parts that pass the parity scenarios P1 and P8. The probe answers
the two known risks: a controlled value is set as a DOM property, and the toggle `click` listener works or is
not needed in Solid.

## Scope

- In: a minimal `packages/solid-v1/src/create-parts.ts` with `Root` and the part components, enough for P1 and
  P8. The parity driver and fixture views for P1 and P8 in `packages/solid-v1/tests/parity.spec.tsx`. The
  `options` prop of `Root`, as `01#6.1` states it.
- Out: the full Solid 1 surface and the other scenarios (TK-044). Solid 2 (TK-045). The `@oxform/solid`
  package (TK-046).

## Read first

- `01-public-api.md#6.3`: the last paragraph names the two risks. The table lists what differs from React.
- `01-public-api.md#6.1`: the part contract and the `Options` row (written by TK-037).
- `02-structure.md#Solid`: the `packages/solid-v1` tree.
- `03-testing.md#Adapter tests: the parity suite`: P1 and P8.
- No Solid spike exists. Read only, for patterns: the current `packages/solid-v1/src` (`internal/`,
  `create-form.ts`) and the `field` slot in `explorations/extension-api/spike/src/slots.ts`. Write the code new.

## Decisions to apply

- D34: options are a type only. `Root` takes them in `options`, as `01#6.1` states.
- R10: the part model was made for React and has no Solid spike. If P1 or P8 cannot pass with that model,
  stop. Propose a change to `01#6.1` or `01#6.3` before TK-044 and TK-045 start. Record which path was taken
  under Evidence.

## Acceptance

- [ ] P1 and P8 pass in `packages/solid-v1/tests/parity.spec.tsx` in Chromium.
- [ ] A test shows that a controlled value reaches the element as a DOM property.
- [ ] A test shows whether the toggle `click` listener is needed in Solid.
- [ ] `vp run @oxform/solid-v1#check:types` passes.

## Evidence

Record the command results, the result of each risk, the R10 path and any deviation from the plan here.
