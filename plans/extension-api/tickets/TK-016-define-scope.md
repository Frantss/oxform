---
id: TK-016
title: defineScope
phase: 2
work_package: P2-07
status: todo
depends_on: [TK-012]
branch: codex/P2-07-define-scope
pr: null
started: null
completed: null
---

# TK-016: `defineScope`

## Outcome

A scope describes a sub-object once. `defineForm({ scopes })` places its defaults at each path, and an
instance can override them. `create` applies conflict rules 1, 2, 5 and 6. A form without scopes does not load
`main/scopes.ts`.

## Scope

- In: `src/main/scopes.ts` with `defineScope`, its mount and verify hooks under the scope symbol keys, and
  conflict rules 1, 2, 5 and 6. The calls through those keys in `src/main/form.ts`. The `ScopeDefinition` and
  `ScopedValues` types. Their exports from `export/index.ts`. The sibling spec `src/main/scopes.spec.ts` and
  the type tests of these exports.
- Out: scope validators and conflict rules 3 and 4 (TK-029). The rows of `03#Scopes` on validation, change and
  reset at a path (TK-029). `form.scope`, the `Scope` type, the scope view row and `prefixOf` (TK-027).

## Read first

- `01-public-api.md#2.1`, `#2.2` and `#2.3`: the `defineScope` row, the "Scope" type group and the
  `defineScope` contract.
- `01-public-api.md#5`: the scope keys row.
- `02-structure.md#Source tree`: what `main/scopes.ts` holds, and the rule that `form.ts` reaches a scope only
  through its symbol keys.
- `03-testing.md#Scopes (defineScope, form.scope)`: the rows for defaults and for rules 1, 2, 5 and 6.
- `03-testing.md#Matrix`: the row for `defineScope, Scope, ScopeDefinition, ScopedValues, form.scope`.
- Spike, read only: `explorations/extension-api/spike/src/scopes.ts` and `scopes.spec.ts`. Type cases:
  `explorations/extension-api/type-tests/scopes.tsx`. The spike spec uses the `standard` preset. Write the
  code new, and use test-local extensions.

## Decisions to apply

None.

## Acceptance

- [ ] The rows of `03#Scopes` for defaults and for rules 1, 2, 5 and 6 have a passing test in
      `src/main/scopes.spec.ts`.
- [ ] An own key or a dotted key throws at `create` and names the scope.
- [ ] `main/form.ts` and the modules it imports do not import `main/scopes.ts`. Record how you checked it.
- [ ] `defineScope`, `ScopeDefinition` and `ScopedValues` have a positive and a negative type case in
      `tests/types/`, with the duplicate-key cases of the "Duplicate names" matrix row.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.
