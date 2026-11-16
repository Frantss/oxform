---
id: TK-071
title: Delete the spikes
phase: 9
work_package: P9-02
status: todo
depends_on: [TK-070]
branch: codex/P9-02-delete-spikes
pr: null
started: null
completed: null
---

# TK-071: Delete the spikes

## Outcome

`explorations/` is deleted. `pnpm run build` and `pnpm run check:all` pass without it.

## Scope

- In: delete `explorations/`. Remove each reference to it from configuration, scripts, `docs/*.md`, readmes
  and `AGENTS.md`. Findings in `reports/` keep their references.
- Out: the plan files, which TK-074 removes. The version bump (TK-072).
- Deleting the folder cannot be undone in the working tree. The tag of TK-001 (P0-03) keeps its history.

## Read first

- `02-structure.md#Target workspace`: the deletion and the hazard of the folder.
- `06-roadmap.md#Approach to the rebuild`: the rule for `explorations/`.

## Decisions to apply

- None in the register.

## Acceptance

- [ ] The tag of TK-001 exists and points at the last commit where the spike builds.
- [ ] `explorations/` does not exist.
- [ ] No file outside `reports/` and `plans/` names `explorations/`.
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.
- [ ] `pnpm run check:format` passes.

## Evidence

Record the tag name, the command results and any deviation from the plan here.
