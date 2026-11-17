---
id: TK-051
title: React example app
phase: 7
work_package: P7-04
status: done
depends_on: [TK-042, TK-050]
branch: codex/P7-04-react-example
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each of E29 to E33 has a rendering module that matches its row of `04#4.2`.
- [x] The five domain forms render from kit code. No file is copied from the spike.
- [x] Each example module has one browser flow. Together they validate, submit, reorder an array and reset
      (I8).
- [x] `vp run example-oxform-react#test` passes.
- [x] `vp run example-oxform-react#check:types` passes, and the app builds `playground.html`.
- [x] The app runs, and each flow works at desktop and mobile sizes with no console error (`AGENTS.md`,
      "Validation").
- [x] `pnpm run check:all` passes.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. `example-oxform-react` runs 19 browser cases in
  Chromium, all pass. Its type check covers `src` and `tests`. Its build writes `index.html` and
  `playground.html`.
- Rendering modules in `src/examples/`: the five domain forms (`sign-in.tsx` with E29, `checkout.tsx`,
  `team-invites.tsx`, `article-editor.tsx`, `member-filter.tsx`), E30 `country-select.tsx`, E31
  `address-fields.tsx`, E32 `order-summary.tsx`, E33 `member-list.tsx`, and `member-row.tsx` (E16 and E24). Each has
  one flow in `tests/`. Together they validate, submit, reorder an array and reset (I8). Every form comes from
  the kit. The app and the playground list the five forms. The playground reads `?example=`.
- Browser check: the dev server, every form at 1280 × 720 and 390 × 844, after a submit. No page overflows.
  The only console message is the version notice of the React Scan script that `index.html` already loaded.
  The playground page logs nothing.
- Fix: the alias `@oxform/core` also matched `@oxform/core/behaviors`, so no kit module loaded. The aliases now
  match each entry point whole. The Solid apps have the same alias (TK-052, TK-053).
- Kit changes for the app: `countries` and `articles.saveDraft` for the forms, and the autosave text "Draft not
  saved", which no longer repeats the "Unsaved changes" label of E22. `createDrafts` and `warnBeforeUnload` take
  only the members they use (`01-public-api.md`, the "any form" row), so the editor with `warnings` fits.
- E22: a slot attribute wins over a prop of the author, so `Submit` cannot take `disabled` from the page. "Publish"
  is a plain submit button that takes `disabled` from the `articleStatus` selector. That is the limit that E13
  shows.
- E25 uses `useEffect` around `warnBeforeUnload` (D31).
