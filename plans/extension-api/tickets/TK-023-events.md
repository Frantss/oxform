---
id: TK-023
title: Events extension
phase: 3
work_package: P3-05
status: todo
depends_on: [TK-022]
branch: codex/P3-05-events
pr: null
started: null
completed: null
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

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `events`, also the row "on a
      chain with no `validation`".
- [ ] Each scenario group of `03#events (createEvents)` has a passing test in `src/behaviors/events.spec.ts`.
      Each row that cites `B:` or `C:` passes.
- [ ] Each need (`values`, `status`) has a negative type case and a unit case for its runtime error at
      `create`.
- [ ] The specs build the shortest chain and do not import `standard`.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `export/behaviors.ts` exports no `createX` function.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.
