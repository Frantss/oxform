---
id: TK-050
title: Kit behaviors
phase: 7
work_package: P7-03
status: done
depends_on: [TK-048, TK-049]
branch: codex/P7-03-kit-behaviors
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-050: Kit behaviors

## Outcome

The example kit holds the framework-neutral code of rows E15 to E28, without rendering. Each row has a
passing spec on its domain form.

## Scope

- In: kit modules in `examples/kit/src/` for E15 (`address` scope and `copyAddress`), E16 (`form.scope` on an
  array item), E17 (`arrays`), E18 (validation by event), E19 (`submit`), E20 (`handles`), E21 (`values`), E22
  (`status`), E23 (`reset`), E24 (events from a control with no DOM event), E25 (`createEffect`), E26 (the
  server-rendering form), E27 (the request handler) and E28 (testing an extension). A sibling `*.spec.ts` for
  each module.
- Out: E01 to E03 and E05 (TK-048). E04 and E06 to E14 (TK-049). Rendering code, including `useField`, `Root` and `Scope`
  props (TK-051, TK-052, TK-053).

## Read first

- `04-documentation.md#4.2`: the rows E15 to E28.
- `04-documentation.md#8`: the single-source rule.
- `02-structure.md#Examples`: the kit layout.
- `01-public-api.md#2.1` and `#2.3`: `defineScope`, `form.scope` and `createEffect`.
- `01-public-api.md#3.1`: the contracts of `arrays`, `validation`, `check`, `submit`, `handles`, `values`,
  `status`, `reset` and `events`.
- `03-testing.md#Integration layer`: I2, I4 and I6 give the async, scope and request-handler rules.
- Spike, read only: `explorations/extension-api/examples/04-arrays.tsx`, `07-runtimes-and-testing.tsx` and
  `08-scopes.tsx`, and `explorations/behavior-api/playground/src/examples/checkout.tsx`,
  `async-validation.tsx`, `login.tsx` and `third-party.tsx`. Write the code new.

## Decisions to apply

- D37: the kit holds no rendering code. It imports only `@oxform/core` entry points.
- D19: E28 tests the extension through a public chain. It imports no `createX` function.
- D23: a discarded validation run resolves an empty list per check (E18).
- D15: an adapter always passes its own id. A kit form at module scope sets no id (E26).
- D16: only the creator of an instance calls `destroy()` (E26, E27).
- D25: a scope of the wrong shape is a type error if the phantom member works. Else the limit is on
  `limits.mdx`.

## Acceptance

- [x] Each of E15 to E28 is one kit module that matches its row of `04#4.2`, with a passing sibling spec.
- [x] E18: a newer run discards a stale lookup result. E27: two concurrent requests share nothing.
- [x] No kit module imports an adapter or renders. No file is copied from the spike.
- [x] `vp run example-oxform-kit#test` and `vp run example-oxform-kit#check:types` pass.
- [x] `pnpm run check:all` passes.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0, with the two lint warnings of the first run
  fixed and `check:all` run again (exit 0, no warning). The kit has 66 specs, all pass.
- Modules, each with a sibling spec: E15 `address.ts`, E16 `member-row.ts`, E17 `member-list.ts`, E18
  `team-invites.ts`, E19 `sign-in-submit.ts`, E20 `payment-issues.ts`, E21 `region.ts`, E22 `article-status.ts`,
  E23 `article-drafts.ts`, E24 `role-select.ts`, E25 `unsaved-warning.ts`, E26 `sign-in-page.ts`, E27
  `sign-in-handler.ts`, E28 `draft-form.ts`. `services.ts` holds the in-memory servers.
- E18: a lookup that a newer change made stale is dropped. With the newer change removed from the spec, it fails.
  E27: two concurrent requests answer in the reverse order, and each page shows only its own values and errors.
- E03 now places the `address` scope at `billing` and `shipping` (E15), so the catalogue has one checkout.
- Deviation in E16: the row types the row as `Scope<Member>`. The default check list of `Scope` is `never`, so
  the kit uses `Scope<Member, 'error'>`, as `01-public-api.md` (the "any form" row) decides.
- Deviation in E23: `reset.all({ values })` keeps the default values, so the kit keeps the last saved values.
  Reported.
- Deviation in E27: the handler runs `submit.run()`, which validates and calls the server, in place of
  `validation.run()` alone, so a valid post signs in.
- E24 types the role field as `Role | undefined`: an item path reads `undefined` when the index has no item.
- No module imports an adapter or renders. `testing.ts` reads slots through `@oxform/core/adapter` for the specs.
