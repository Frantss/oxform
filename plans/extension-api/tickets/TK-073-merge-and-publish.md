---
id: TK-073
title: Merge and publish
phase: 9
work_package: P9-04
status: todo
depends_on: [TK-072]
branch: codex/P9-04-merge-and-publish
pr: null
started: null
completed: null
---

# TK-073: Merge and publish

## Outcome

`main` holds the rebuild, and `pnpm run prepublish` passes on it. The registry lists `@oxform/core`,
`@oxform/react` and `@oxform/solid` at 0.7.0, ESM only. A consumer install resolves one copy of core. The site
serves the new tree.

## Scope

- In: merge `main` into `codex/extension-api-rebuild` one last time, and pass CI. Merge the integration branch
  into `main` in one merge, through a pull request (`gh`). Run `pnpm run prepublish`, then `pnpm run publish`,
  on `main`. Confirm that the site serves the new tree, and that the hosting health check uses the path that
  TK-058 wrote in `apps/docs/README.md`.
- Out: the version bump (TK-072). Removing the plan (TK-074). Stage B of the in-package docs.
- Side effect: a merge into `main`, a publish of three packages to the registry, and a deploy of the site. It
  needs the owner's approval when it runs (`AGENTS.md`, "Autonomy").

## Read first

- `02-structure.md#Release`: the flow, which is manual, and the peer range.
- `06-roadmap.md#Approach to the rebuild`: approach A, and the rules for `main`.
- `06-roadmap.md#Risk register`: R13, drift from `main`.
- `06-roadmap.md#Phase 9: release 0.7.0 and cleanup`: the phase exit criteria.
- `04-documentation.md#10`: the published site serves 0.6 until this release.
- The Evidence section of TK-070: the items that this ticket closes.

## Decisions to apply

- D01: merge the integration branch into `main` once, at release.
- D46: publish 0.7.0 with no prerelease.

## Acceptance

- [ ] `pnpm run build`, `pnpm run check:all`, `pnpm run test` and `pnpm run docs:check:agents` pass on `main`.
- [ ] `pnpm run prepublish` passes on `main`.
- [ ] The registry lists 0.7.0 for the three packages, each ESM only.
- [ ] A consumer install of `@oxform/react` and `@oxform/solid` in an empty project resolves one copy of
      `@oxform/core`.
- [ ] The live site serves the new tree, and `/docs/react`, `/docs/solid` and `/docs/core` redirect to the
      introduction. It works at desktop and mobile sizes, with no runtime, SSR or hydration error in the
      console (`AGENTS.md`, "Validation").
- [ ] Each item of `06#Definition of done for 0.7.0` that TK-070 left open has evidence.

## Evidence

Record the pull request, the command results, the registry output, the consumer install and the site check
here.
