---
id: TK-009
title: CI on the integration branch
phase: 1
work_package: P1-09
status: todo
depends_on: [TK-005, TK-007]
branch: codex/P1-09-ci
pr: null
started: null
completed: null
---

# TK-009: CI on the integration branch

## Outcome

CI on a pull request into the integration branch runs the step order of `02#CI`, with `check:tree-shaking` and
the coverage run. A pull request that puts a forbidden marker in a placeholder tier fails.

## Scope

- In: the steps of `.github/workflows/ci.yml` in the order of `02#CI`. The root `test:coverage` script, which
  runs core `test:coverage`. The steps after `build` run even when an earlier step fails.
- In: leave out a step whose script does not exist yet (`check:terms`, `check:parity`, `docs:check:agents`).
  The ticket that adds the script adds its CI step.
- Out: the `pull_request` trigger (TK-001). Adapter `test:coverage` in the root script (TK-042). The steps of
  `check:terms`, `docs:check:agents` (TK-059) and `check:parity` (TK-036).

## Read first

- `02-structure.md#CI`: approach A and the step order.
- `02-structure.md#Tooling and scripts`: the root `test:coverage` script.
- `03-testing.md#CI mapping`: what blocks a merge, and "no layer is skipped".
- `06-roadmap.md#Gaps in scripts and checks`: gap 3.

## Decisions to apply

- Use one job with ordered steps (approach A of `02#CI`). No parallel jobs.
- Gap 3: this ticket adds the root `test:coverage` and its CI step.
- `report:size`, `compare:size`, `compare:check` and the benchmark are not CI steps.

## Acceptance

- [ ] CI on a pull request into `codex/extension-api-rebuild` runs `build`, `check`, `check:package`,
      `check:tree-shaking`, `test:coverage` and `test`, in that order, and passes.
- [ ] A test pull request that puts a forbidden marker in a placeholder tier fails at `check:tree-shaking`,
      and the later steps still run.
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Record the links to the passing and the failing CI runs, and any deviation from the plan here.
