---
id: TK-041
title: React server rendering and lifecycle
phase: 5
work_package: P5-06
status: done
depends_on: [TK-037]
branch: codex/P5-06-react-server-lifecycle
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-041: React server rendering and lifecycle

## Outcome

The server HTML of the quick start form has the state at creation and matches the stored snapshot. Hydration
replaces no control and logs nothing. A server render starts no work and shares no state. `Root` accepts an
existing instance, and unmount and a double mount work. The parity scenarios P10 to P14 pass.

## Scope

- In: `packages/react/tests/server/*.spec.tsx` in Node, with `vite.ssr.config.ts` and `test:ssr`. The driver
  functions `renderToString` and `hydrate`. The `form` prop of `Root`, the cleanups on unmount and the strict
  mode double mount. The P10 snapshot file in `packages/adapter-parity`, written from React after id
  normalization.
- Out: `createParts` and the parts (TK-037). The hooks (TK-038). The Solid runs of P10 to P14 (TK-044,
  TK-045). The check that the three adapters share one P10 snapshot (TK-047).

## Read first

- `01-public-api.md#6.1`: the rows `Root`, `Options`, `Lifecycle`, `Ids` and `Server render`.
- `01-public-api.md#6.2`: the server snapshot of `useSelector`.
- `01-public-api.md#9`: G1, G12 and G19.
- `03-testing.md#Adapter tests: the parity suite`: P10 to P14, and the shared P10 snapshot.
- `02-structure.md#@oxform/react`: `tests/server/` and `vite.ssr.config.ts`.
- Spike, read only: `explorations/extension-api/spike/src/react/parts.spec.tsx` (server and mount rows) and
  `parts-core.spec.tsx`. Write the code new.

## Decisions to apply

- G19 (with D16): the adapter never calls `destroy`, on the client or the server. Leaving the tree runs the
  instance's cleanups and keeps the instance usable.
- G12: type `Root` with `form` apart from `Root` with options, so option props beside `form` are a type error.
  A `form` that changes is a documented limit.

## Acceptance

- [x] P10, P12 and P13 pass in Node through `vp run @oxform/react#test:ssr`.
- [x] P11 and P14 pass in `packages/react/tests/parity.spec.tsx` in Chromium. P11 sees no console warning or
      error.
- [x] P14's double mount runs in React strict mode.
- [x] No adapter source calls `destroy`.
- [x] `vp run @oxform/react#test` runs the browser tests, then `test:ssr`, and passes.
- [x] `vp run @oxform/react#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `vp run @oxform/react#test` runs the browser tests, then `test:ssr` (`vite.ssr.config.ts`, Node). The browser
  config excludes `tests/server/**`.
- P10, P12 and P13 pass in Node (`tests/server/parity.spec.tsx`). P10 wrote the three shared snapshots in
  `packages/adapter-parity/src/snapshots/`: the initial values, the issues after a failed submit
  (`aria-invalid`, `aria-describedby` and the error parts), and `disabled` while submitting.
- P11 and P14 pass in Chromium. P11 hydrates the server HTML of `signIn`, keeps the email input element, and
  sees no `console.error` or `console.warn`. P14's double mount runs in React `StrictMode`, and an unmount runs
  the cleanups once and keeps the instance usable.
- The `form` prop of `Root` (G12) existed since TK-037. No adapter source calls `destroy` (G19).
- Fixed in the parity package: P10 gave its instance the id `sign-in`, which is also the value of the submit
  button, so the normalization replaced the value. The id is now `server-form`.
- The snapshots are in the formatter's ignore list: `vp fmt` reformatted the HTML, and P10 then failed.
- Every scenario of P1 to P14 passes for React: 22 browser cases and 3 Node cases.
