---
id: TK-051
title: React example app
phase: 7
work_package: P7-04
status: todo
depends_on: [TK-042, TK-050]
branch: codex/P7-04-react-example
pr: null
started: null
completed: null
---

# TK-051: React example app

## Outcome

`examples/react` renders the five domain forms from the kit, with E29 to E33, and builds its playground. Each
example has one browser flow that passes in Chromium.

## Scope

- In: `examples/react/src/examples/` with one rendering module per catalogue example, including E29
  (`createParts` and the element map), E30 (`usePart`), E31 (`useScope` and the `scope` prop), E32
  (`useSelector`) and E33 (`useArray`). The rendering of the five domain forms, with the parts of the kit rows
  that they show. `src/main.tsx`, `src/playground.tsx`, `index.html`, `playground.html`. One browser flow per
  example in `examples/react/tests/` (I8).
- Out: framework-neutral code of any row (TK-048, TK-049, TK-050). The Solid apps (TK-052, TK-053). The docs
  playground route and the React pages (TK-064).

## Read first

- `04-documentation.md#4.1` and `#4.2`: the domains and the rows E29 to E33.
- `04-documentation.md#8`: single source, and the playground lists the five domain forms.
- `02-structure.md#Examples`: the app layout and the `playground.html` entry.
- `03-testing.md#Integration layer`: I8, and the browser setup (Chromium at 1280 × 720).
- `01-public-api.md#6.1` and `#6.2`: the React adapter surface.
- `docs/testing.md`: the browser test patterns.
- Spike, read only: `explorations/extension-api/examples/02-using-a-form.tsx`, `04-arrays.tsx` and
  `08-scopes.tsx`. Old flow, read only: `examples/react/src/tests/checks.spec.tsx` at the tag of TK-001.
  Write the code new.

## Decisions to apply

- D37: the rendering code lives in the app. The rest comes from the kit.
- D30: parts take the `scope` prop. `within` does not exist. The hooks take `{ scope }`.
- D32: `usePart` takes the part's own props.
- D31: no adapter effect hook. E25 uses the documented React pattern.
- D49: the member filter has no root group, and its `Root` renders no element.

## Acceptance

- [ ] Each of E29 to E33 has a rendering module that matches its row of `04#4.2`.
- [ ] The five domain forms render from kit code. No file is copied from the spike.
- [ ] Each example module has one browser flow. Together they validate, submit, reorder an array and reset
      (I8).
- [ ] `vp run example-oxform-react#test` passes.
- [ ] `vp run example-oxform-react#check:types` passes, and the app builds `playground.html`.
- [ ] The app runs, and each flow works at desktop and mobile sizes with no console error (`AGENTS.md`,
      "Validation").
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results, the browser check and any deviation from the plan here.
