---
id: TK-052
title: Solid 1 example app
phase: 7
work_package: P7-05
status: done
depends_on: [TK-046, TK-051]
branch: codex/P7-05-solid-example
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-052: Solid 1 example app

## Outcome

`examples/solid` renders the same content as the React app with Solid 1 and `@oxform/solid`, and builds its
playground. Each example has one browser flow that passes in Chromium.

## Scope

- In: `examples/solid/src/examples/`, `src/main.tsx`, `src/playground.tsx`, `index.html`, `playground.html` and
  `examples/solid/tests/`, with the same examples and flows as `examples/react`.
- Out: kit code (TK-048, TK-049, TK-050). The React app (TK-051). The Solid 2 app (TK-053). The Solid docs pages
  (TK-065).

## Read first

- `02-structure.md#Examples`: the app layout.
- `04-documentation.md#8`: single source, and the Solid snippet rule.
- `03-testing.md#Integration layer`: I8 and the browser setup.
- `01-public-api.md#6.1` and `#6.3`: the shared contract and the Solid differences.
- `examples/react/`: the content to match, from TK-051.

## Decisions to apply

- D37: the rendering code lives in the app. The rest comes from the kit.
- D33: the Solid hooks keep the `use*` names.
- D30: parts take the `scope` prop. The hooks take `{ scope }`.
- D32: `usePart` takes the part's own props.
- D31: no adapter effect hook. E25 uses the documented Solid pattern.

## Acceptance

- [x] Each example of `examples/react/src/examples/` has a Solid 1 module, and each has one browser flow.
- [x] No file is copied from the spike or from the React app's rendering code.
- [x] `vp run example-oxform-solid#test` passes.
- [x] `vp run example-oxform-solid#check:types` passes, and the app builds `playground.html`.
- [x] The app runs, and each flow works at desktop and mobile sizes with no console error (`AGENTS.md`,
      "Validation").
- [x] `pnpm run check:all` passes.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. `example-oxform-solid` runs 19 browser cases in
  Chromium, the same flows as React, all pass. Its type check covers `src` and `tests`. Its build writes
  `playground.html`.
- `src/examples/` has a Solid 1 module for each module of `examples/react/src/examples/`, and `tests/` has the same
  flows. The modules are written for Solid, not copied: no destructured props, accessors in reactive scopes.
- Browser check: the dev server, every form at 1280 × 720 and 390 × 844, after a submit, and the playground. No
  console message, no page overflow.
- Differences from the React app, with their row of `01#6.3`:
  - "`useSelector` result": each selector is an accessor. The member filter selects `hasFilters(form)`, because a
    Solid component does not run again.
  - "`children` as function": `Submit` reads `state()`.
  - "`render`": a function only. The body of the article is `render={props => <textarea {...props} />}`.
  - "Hook path arguments": a row of the member list is not rendered again when it moves, so its scope is
    `useScope(() => \`members.${index()}\`)`. The `{ scope }` option of a hook is read once.
  - "Cleanup": E21, E23 and E25 stop through `onCleanup` (D31).
  - Attribute names: Solid takes the HTML names (`novalidate`, `autocomplete`, `inputmode`).
- Fix: the alias `@oxform/core` also matched its other entry points. The aliases now match each one whole.
- Workspace limit: the built `@oxform/solid` declarations resolve `solid-js` from `packages/solid`, whose dev
  dependency is Solid 2, so every part typed its element as `never`. `tsconfig.json` points `solid-js` to the Solid
  1 of the app with `paths`. A consumer has one `solid-js`. Reported.
