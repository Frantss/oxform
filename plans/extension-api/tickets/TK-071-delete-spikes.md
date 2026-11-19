---
id: TK-071
title: Delete the spikes
phase: 9
work_package: P9-02
status: done
depends_on: [TK-070]
branch: codex/P9-02-delete-spikes
pr: null
started: 2026-11-18
completed: 2026-11-18
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

- [x] The tag of TK-001 exists and points at the last commit where the spike builds.
- [x] `explorations/` does not exist.
- [x] No file outside `reports/` and `plans/` names `explorations/`.
- [x] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.
- [x] `pnpm run check:format` passes.

## Evidence

- Tag: `spike/extension-api` (annotated, "last commit where explorations/extension-api builds") points at
  `7f1b012`. It exists locally only; TK-073 pushes it with the release.
- Deleted `explorations/` (192 tracked files) in `f23c3cb`, applied directly on the integration branch.
- The only reference outside `reports/` and `plans/` was the lint ignore pattern in `vite.config.ts:27`; it is
  removed. `git grep explorations -- ':!reports' ':!plans'` finds nothing. `pnpm install` left the lockfile
  unchanged.
- `pnpm run build` (13/13), `pnpm run check:all`, `pnpm run check:format` and `pnpm run test` exit 0. Tests: core
  404, parity 5, React 24 + 3, Solid 1 29 + 3, Solid 2 60 + 3, kit 69, example apps 21, 19 + 2, 38 + 2.
