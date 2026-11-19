---
id: TK-064
title: React pages
phase: 8
work_package: P8-07
status: done
depends_on: [TK-051, TK-059, TK-033]
branch: codex/P8-07-react-pages
pr: null
started: 2026-11-18
completed: 2026-11-18
---

# TK-064: React pages

## Outcome

A React reader can install Oxform, write and render the sign-in chain, and swap it for `standard` on one
quick-start page. The React adapter page, the recipes and the rendering part of the guides are published. The
playground lists the five domain forms. Every page works at desktop and mobile sizes.

## Scope

- In: `quick-start.mdx`, `adapters/index.mdx`, `adapters/react.mdx` and the 10 `recipes/*` pages of
  `04-documentation.md#5`. The rendering part of the guides (E29 to E33), in a code tab titled `React`. The
  `/playground` route with the five domain forms, each linked to its guides. The measured size of both chains
  on the quick start.
- Out: the core part of the guides (TK-063). `adapters/solid`, `adapters/solid-v2` and the Solid tabs
  (TK-065). If the review is too large, split this ticket by folder (`06-roadmap.md#Deviations and decisions`
  8).

## Read first

- `04-documentation.md#4.2`: the rows E19, E26, E27 and E29 to E33.
- `04-documentation.md#5` and `#5.1`: the pages and the quick-start decision.
- `04-documentation.md#6`: the guide, adapter and recipe templates.
- `04-documentation.md#7.3`: the page rules, and rule 11 for framework tabs.
- `04-documentation.md#8`: the playground and the include policy.
- `04-documentation.md#10`: step 8.
- `04-documentation.md#11`: decision 5, the `<Root form={instance}>` recipe after I6 and P14 pass.
- `01-public-api.md#6.1` and `#6.2`: the adapter surface.

## Decisions to apply

- D39: the quick start shows the lean sign-in chain first, on one page. `standard` is the last step.

## Acceptance

- [x] The quick start writes no slot by hand, and its last step replaces the chain with `.extend(standard)`.
- [x] Each rendering snippet is an `<include>` of an `examples/react` file, in a tab titled `React`.
- [x] Each page names a catalogue id that exists in the kit or in `examples/react`.
- [x] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [x] The pages and the playground work at desktop and mobile sizes. The console shows no runtime, SSR or
      hydration error (`AGENTS.md`, "Validation").
- [x] `pnpm run check:format` passes.

## Evidence

Commands (worktree root, after the rebase onto `5e75f21`):

- `pnpm run build`: 12/12 successful. `pnpm run docs:build`: passes, with Twoslash on every inline block of the new
  pages (for example `form.field('email').error()` on the quick start).
- `pnpm run docs:check:agents`: "69 pages and 7 templates pass". `--record-heading-ids` added 90 ids and removed
  none (compared with the committed list by script).
- `pnpm run check:terms`: no forbidden term. `pnpm run check:format`: all files pass. `pnpm run check:all`: passes.
- `pnpm run test`: every workspace passes. `examples/react`: 12 files, 21 tests, with the new
  `tests/sign-in-server.spec.tsx` (E27: the posted values and their errors in the HTML, no error after a valid
  sign-in).

Browser check (production server, port 3205, Playwright, 1280x800 and 390x844): the 21 pages (quick start,
adapters, react, the 10 recipes, the 8 guides with a rendering step) return 200, have no horizontal overflow, and
log no console error, page error or hydration warning. The playground, for React, Solid 1 and Solid 2 and each of
the five forms: the guide links and source files show, and a script types, submits invalid, submits valid and
resets each form (member filter: types a filter and clears it), then presses "Reset demo". No problem was found.

Tab syntax of each rendering snippet, for TK-065 (add `Solid 1` and `Solid 2` to `items` and one `Tab` each):

```mdx
<Tabs groupId='framework' items={['React']}>
  <Tab value='React'>
    <include meta='no-check="checked in the React example"'>path of the examples/react file</include>
  </Tab>
</Tabs>
```

Deviations and decisions (owner decision 18):

- The quick start states in words what `standard` adds (arrays, reset, handles, the `reset` part). It has no measured
  size: TK-033 is dropped.
- The agent check needs an `@oxform/` import in each included file. Files of `examples/react` that shared parts
  through `checkoutParts`, `teamInvitesParts` and `articleEditorParts` now call `createParts` with the same form
  object in each file. The parts of one form object share one instance lookup, so they work together. The React
  page states this.
- `RegionSelect` moved to `region-select.tsx` (E21) and the article actions to `article-actions.tsx` (E22, E23,
  E25), so the recipes include only the code of their task. The Solid examples keep them inline (TK-065 may split
  them; the playground lists only the files that a framework has).
- E27 needed a React file: `sign-in.tsx` exports `SignInFields`, and `sign-in-server.tsx` renders the instance of
  the request handler with `<Root form={form}>` and `renderToString`. The sign-in `Root` has `method='post'`.
  Decision 5 of `04#11` holds: I6 (TK-032) and P14 (TK-036) pass.
- `adapters/react` also uses `React` tabs for its rendering snippets, so every rendering snippet follows one rule.
- The rendering steps add `'@oxform/react'` to the `entry` of each guide, and `E29` to `compose/lean-form`.
- `third-party-controls` includes only `member-row.tsx`: `examples/kit/src/role-select.ts` has no `@oxform/` import,
  so the page names it by path.
- `adapters/index` links no Solid page: they do not exist yet (TK-065). The introduction does not link
  `adapters/react` (not in this ticket's paths).
- The playground guide links use new `.playground-guides` rules in `apps/docs/src/styles/app.css`.
- Finding: the built React adapter drops `'use client'` (`reports/extension-api-rebuild.md`). The React page states
  no `'use client'` fact.
