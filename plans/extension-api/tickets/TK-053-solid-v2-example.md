---
id: TK-053
title: Solid 2 example app
phase: 7
work_package: P7-06
status: todo
depends_on: [TK-046, TK-051]
branch: codex/P7-06-solid-v2-example
pr: null
started: null
completed: null
---

# TK-053: Solid 2 example app

## Outcome

`examples/solid-v2` renders the same content as the React app with Solid 2 and `@oxform/solid/v2`, and builds
its playground. Each example has one browser flow that passes in Chromium.

## Scope

- In: `examples/solid-v2/src/examples/`, `src/main.tsx`, `src/playground.tsx`, `index.html`, `playground.html`
  and `examples/solid-v2/tests/`, with the same examples and flows as `examples/react`. These files are the
  source of the Solid 2 docs snippets.
- Out: kit code (TK-048, TK-049, TK-050). The React app (TK-051). The Solid 1 app (TK-052). The Solid docs pages
  (TK-065).

## Read first

- `02-structure.md#Examples`: the app layout, and Solid 2 snippets come from this workspace.
- `04-documentation.md#8`: single source, and the Solid snippet rule.
- `03-testing.md#Integration layer`: I8, and the Solid 2 browser instance at 390 × 844.
- `01-public-api.md#6.1` and `#6.3`: the shared contract and the Solid differences.
- `examples/react/`: the content to match, from TK-051.

## Decisions to apply

- D37: the rendering code lives in the app. The rest comes from the kit.
- D33: the Solid hooks keep the `use*` names.
- D30: parts take the `scope` prop. The hooks take `{ scope }`.
- D32: `usePart` takes the part's own props.
- D31: no adapter effect hook. E25 uses the documented Solid pattern.

## Acceptance

- [ ] Each example of `examples/react/src/examples/` has a Solid 2 module, and each has one browser flow.
- [ ] No file is copied from the spike or from the React app's rendering code.
- [ ] `vp run example-oxform-solid-v2#test` passes.
- [ ] `vp run example-oxform-solid-v2#check:types` passes, and the app builds `playground.html`.
- [ ] The app runs, and each flow works at desktop and mobile sizes with no console error (`AGENTS.md`,
      "Validation").
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results, the browser check and each difference from the React app, with its row of
`01#6.3`.
