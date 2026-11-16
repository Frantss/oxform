---
id: TK-066
title: Migration guide
phase: 8
work_package: P8-09
status: todo
depends_on: [TK-042, TK-046, TK-059]
branch: codex/P8-09-migration-guide
pr: null
started: null
completed: null
---

# TK-066: Migration guide

## Outcome

Each fact of the migration guide is checked on the built packages, and the guide has no `†` row. The guide is
published at `migration/index`. A trial by hand of the guide is recorded in `reports/`.

## Scope

- In: check each `†` row of `05-migration-guide.md` Part B and each of the 11 verification items of Part A on
  the built packages. Correct the text where a fact differs, then remove the mark. Publish Part B as
  `migration/index.mdx`, with the "after" example type-checked. Apply a coding agent to a 0.x application with
  the guide only, and record the result in `reports/`.
- Out: a codemod or a compatibility layer (D43). The agent trial of `04-documentation.md#7.5`, which is a
  different trial. Other pages (TK-060 to TK-065).

## Read first

- `05-migration-guide.md#Part A: about this guide`: the scope and the 11 verification items.
- `05-migration-guide.md#Part B: migrate from Oxform 0.x to 0.7.0 (the extension API)`: the guide.
- `05-migration-guide.md#Deviations and decisions`: the answers for 0.x features with no replacement.
- `04-documentation.md#10`: step 5.
- `02-structure.md#Tooling and scripts`: the migration guide has no script.

## Decisions to apply

- D43: ship no codemod. The agent-focused guide replaces it.
- D44: for the form outside `Root`, move the code inside `Root`, else use `<Root form={instance}>`. For custom
  levels on the preset, use `instance.<name>.at(path)` and `useSelector`, or the nine extensions with the check
  before `handles`. List the removed type helpers in one row, with the read-back types.

## Acceptance

- [ ] `05-migration-guide.md` has no `†`.
- [ ] Each of the 11 items of Part A has a recorded result on the built packages.
- [ ] The "after" example compiles in `pnpm run docs:build`.
- [ ] The trial is recorded in `reports/`: the application, the agent, the result of section 6 "Verify".
- [ ] `pnpm run docs:check:agents` and `pnpm run check:format` pass.
- [ ] `migration/index` renders at desktop and mobile sizes. The console shows no runtime, SSR or hydration
      error (`AGENTS.md`, "Validation").

## Evidence

Record the result of each verification item, the command results and any deviation from the plan here.
