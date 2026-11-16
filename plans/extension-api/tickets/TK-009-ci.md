---
id: TK-009
title: CI on the integration branch
phase: 1
work_package: P1-09
status: done
depends_on: [TK-005, TK-007]
branch: codex/P1-09-ci
pr: null
started: 2026-11-16
completed: 2026-11-16
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
- [x] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

- `.github/workflows/ci.yml`, one job: install, Playwright (cached), `build`, `check`, `check:package`,
  `check:tree-shaking`, `test:coverage`, `test`. Each step after `build` has
  `if: ${{ !cancelled() && steps.build.outcome == 'success' }}`, so it runs when an earlier check fails and is
  skipped when the build fails (the later steps read `dist`). `check:terms`, `check:parity` and
  `docs:check:agents` have no script yet, so they have no step.
- Root `test:coverage`: `vp run @oxform/core#test:coverage` (`5 files fully covered.`, `Statements : 100%`).
- Owner request, beyond the plan: lefthook 2.2.2 pre-commit hooks.
  - `lefthook.yml` runs two parallel jobs on the staged files: `vp fmt` (fixes and stages again) and
    `vp lint --type-aware` (the lint of `check:rules`).
  - The root `prepare` script runs `lefthook install`. `pnpm-workspace.yaml` sets `allowBuilds.lefthook: false`,
    because pnpm stopped with `ERR_PNPM_IGNORED_BUILDS` on the lefthook build script, and `prepare` already
    installs the hook.
  - A staged file `scripts/probe.ts` with bad formatting was formatted and staged again. A staged
    `packages/core/src/internal/probe.ts` that imports `#main/form` failed the `lint` job with
    `no-restricted-imports`, exit 1. Both probes were removed.
  - The hook goes in the shared `.git/hooks`, so all worktrees of the clone use it. In a checkout with no
    `lefthook.yml`, lefthook prints `No config files ... have been found` and exits 0.
- Tree-shaking proof, local part: `export const probe = rootSlots` in `tests/bundle/tier-values.ts` failed
  `check:tree-shaking` with `tier-values contains rootSlots, which its chain does not import.` Reverted.
- Not run (owner decision of 2026-11-16, local only): no pull request, so no CI run. `act` is not installed, so
  the step conditions are not run locally. The workflow parses as YAML with the step order above.
- `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.
