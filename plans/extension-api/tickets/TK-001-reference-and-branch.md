---
id: TK-001
title: Reference tag and integration branch
phase: 0
work_package: [P0-03, P0-04]
status: todo
depends_on: []
branch: codex/P0-03-reference-and-branch
pr: null
started: null
completed: null
---

# TK-001: Reference tag and integration branch

## Outcome

The last commit where the spike builds has a tag. The spike sizes in `03` agree with a new measurement at that
commit. The integration branch `codex/extension-api-rebuild` exists, and CI runs on a pull request into it.

## Scope

- In: measure the spike tiers at the commit to tag, and correct the "Spike gzip" column of
  `03#Tree-shaking content check` if a number differs. Tag that commit. Create the integration branch. Add a
  `pull_request` trigger for the integration branch to `.github/workflows/ci.yml`. Open this ticket's pull
  request into the integration branch to show that CI runs.
- In: the integration branch must hold `plans/extension-api/` and `explorations/extension-api/`. `main` holds
  neither today: they are only on `codex/behavior-api-exploration`. Ask the owner how they reach the branch,
  for example a merge of `codex/behavior-api-exploration` into the branch after it starts from `main`.
- Out: the CI step order and the new CI steps (TK-009). Deleting the old sources (TK-002).
- Side effect: a tag, a new branch and a pull request. It needs the owner's approval when it runs (`AGENTS.md`,
  "Autonomy").

## Read first

- `06-roadmap.md#Approach to the rebuild`: approach A and its rules.
- `06-roadmap.md#Phase 0: the reference and the integration branch`: the exit criteria.
- `02-structure.md#Target workspace`: why the spike stops building after TK-002.
- `03-testing.md#Tree-shaking content check`: the table that holds the spike sizes.
- Spike, read only: `explorations/extension-api/readme.md`, section "Bundle sizes", for the measure command
  (`cd spike && pnpm exec vp pack && node measure-bundles.ts`), and `explorations/extension-api/spike/vite.config.ts`.
  The baseline tier reads `packages/core/dist`, so build `@oxform/core` first.

## Decisions to apply

- D01: approach A. The integration branch is `codex/extension-api-rebuild`, from `main`. A work package
  branch is `codex/<work-package-id>-<short-name>`.
- R14: tag the commit before TK-002 lands, so a spike result can be measured again.
- The plan does not name the tag. Use a name that the owner approves, for example `extension-api-spike`.

## Acceptance

- [ ] The tag exists on the remote and points to a commit where the spike measure command passes.
- [ ] `03#Tree-shaking content check` holds the spike gzip size of each measured tier, and agrees with the new
      measurement.
- [ ] `codex/extension-api-rebuild` exists on the remote and holds `plans/extension-api/` and
      `explorations/extension-api/`.
- [ ] CI runs on this ticket's pull request into the integration branch.

## Evidence

Record the tag name and its commit, the measured sizes, how `plans/` and `explorations/` reached the branch,
the link to the CI run and any deviation from the plan here.
