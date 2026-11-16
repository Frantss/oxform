---
id: TK-064
title: React pages
phase: 8
work_package: P8-07
status: todo
depends_on: [TK-051, TK-059, TK-033]
branch: codex/P8-07-react-pages
pr: null
started: null
completed: null
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

- [ ] The quick start writes no slot by hand, and its last step replaces the chain with `.extend(standard)`.
- [ ] Each rendering snippet is an `<include>` of an `examples/react` file, in a tab titled `React`.
- [ ] Each page names a catalogue id that exists in the kit or in `examples/react`.
- [ ] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [ ] The pages and the playground work at desktop and mobile sizes. The console shows no runtime, SSR or
      hydration error (`AGENTS.md`, "Validation").
- [ ] `pnpm run check:format` passes.

## Evidence

Record the command results, the browser check at each size and any deviation from the plan here.
