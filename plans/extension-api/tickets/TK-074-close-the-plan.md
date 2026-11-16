---
id: TK-074
title: Close the plan
phase: 9
work_package: P9-05
status: todo
depends_on: [TK-073]
branch: codex/P9-05-close-the-plan
pr: null
started: null
completed: null
---

# TK-074: Close the plan

## Outcome

`plans/extension-api/` is removed. Stage B of the in-package docs and every open follow-up are recorded in
`reports/`, so no open item is lost with the plan.

## Scope

- In: record stage B in `reports/`: the generated `docs/` folder per package, `docs:package` in `prepublish`,
  `"docs"` in `files` and `packages/*/docs/` in `.gitignore`. Record each open follow-up from the Evidence
  sections of the tickets, and the drift task of `08-tickets.md` coverage gap 3 if it still applies. Then
  remove `plans/extension-api/`, with these tickets.
- Out: building stage B, which is a later release. Changes to the published packages.

## Read first

- `04-documentation.md#7.4`: stage A and stage B.
- `02-structure.md#Release`: the in-package docs row.
- `02-structure.md#Target workspace`: `plans/` stays until the roadmap is complete.
- `06-roadmap.md#Deviations and decisions`: item 6, stage B as a follow-up.
- The Evidence section of each ticket: the deviations and the open items.

## Decisions to apply

- D40: stage A shipped at 0.7.0. Record stage B as a follow-up for a later release.

## Acceptance

- [ ] `reports/` holds stage B and each open follow-up, each with what it is, where it is and why it matters
      (`AGENTS.md`, "Findings").
- [ ] `plans/extension-api/` does not exist.
- [ ] No file outside `reports/` links `plans/extension-api/`.
- [ ] `pnpm run check:format` passes.

## Evidence

Record the report files, the command results and any deviation from the plan here.
