---
id: TK-023
title: Events extension
phase: 3
work_package: P3-05
status: done
depends_on: [TK-022]
branch: codex/P3-05-events
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-023: Events extension

## Outcome

`events` needs `values` and `status`. `change`, `focus` and `blur` update the status, drive the registered
element and request validation only when a validator exists. It touches an element only in `focus`, `blur`
and `register`.

## Scope

- In: `src/behaviors/events.ts` with the internal `createEvents`, the `events` extension and `eventsInternals`
  (`ref`, `clearRefs`). Element registration and the read of the validation link. The events types of `01#3.3`.
  The sibling spec, the type tests of these exports, and its line in `export/behaviors.ts`.
- Out: the focus guard for a programmatic `focus()` or `blur()` (G17, TK-037). `reset.all` clearing the refs
  (TK-025). The `field` slots that call the events api (TK-028).

## Read first

- `01-public-api.md#3.1`: the `events` row and "Rules that hold for every built-in".
- `01-public-api.md#3.3`: the "events" row.
- `01-public-api.md#5`: the `eventsInternals` and validation link rows.
- `02-structure.md#Source tree`: what `behaviors/events.ts` holds.
- `03-testing.md#Built-in extensions: rows that every one has` and `#events (createEvents)`.
- Spike, read only: `explorations/extension-api/spike/src/events.ts` and the events rows of
  `standard-form.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createEvents` is internal.
- D53: read `validation` through the validation link. With no `validation`, no validation is requested.

## Acceptance

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `events`, also the row "on a
      chain with no `validation`".
- [x] Each scenario group of `03#events (createEvents)` has a passing test in `src/behaviors/events.spec.ts`.
      Each row that cites `B:` or `C:` passes.
- [x] Each need (`values`, `status`) has a negative type case and a unit case for its runtime error at
      `create`.
- [x] The specs build the shortest chain and do not import `standard`.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (653 statements, 292 branches).
- `src/behaviors/events.spec.ts` (chain: `values`, `status`, `events`, or with `validation` and `check('error')`; no
  `standard`):
  - Wrapper rows: exactly the `events` api, no state, no option; a `create` without `values` and one without
    `status` each throw and name the extension and the need; on a chain with no `validation` the status is marked
    and nothing is requested, also with `should.validate: true` (D53); `ref` and `clearRefs` are not on
    `EventsApi`; `eventsInternals` refuses an object that `events` did not make.
  - `change`: writes with the reason `input` and marks dirty and touched; `should.dirty` and `should.touch` off; a
    refused change marks nothing.
  - `focus` and `blur`: drive the registered element and mark touched and blurred; a field without an element.
  - Requested validation: a change validator runs on the path; nothing runs when no check has a validator for the
    event; `should.validate: false` skips; `should.validate: true` runs without a validator; blur and focus
    validators run for their events; the operation returns before the validation settles.
  - Register: the element reaches the ref; `null` keeps it; `unregister` forgets it and keeps the value;
    `clearRefs` forgets every element.
- The handle that exposes the ref is TK-027; this ticket tests the ref through `eventsInternals(events).ref`.
- `export/behaviors.ts` exports `events` and `EventsApi`, `FieldChangeOptions`, `FieldFocusOptions`; no
  `createEvents`.
- Type tests: a positive and a negative case for `events` (a negative case for each need), `EventsApi`,
  `FieldChangeOptions` and `FieldFocusOptions`.
- Issue: a requested validation that rejects is not caught (`void validation.run(...)`), as in the spike. A
  validator that throws during a field event gives an unhandled rejection. Recorded in
  `reports/extension-api-rebuild.md`.
