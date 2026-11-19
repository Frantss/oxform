---
id: TK-072
title: Version
phase: 9
work_package: P9-03
status: done
depends_on: [TK-071]
branch: codex/P9-03-version
pr: null
started: 2026-11-19
completed: 2026-11-19
---

# TK-072: Version

## Outcome

The manifests and the changelogs of `@oxform/core`, `@oxform/react` and `@oxform/solid` show 0.7.0. No private
workspace changes version.

## Scope

- In: run `pnpm run version:bump`, which consumes the `minor` changeset of TK-008. If TK-008 recorded the
  fallback of D04, set the three versions by hand and write one changelog entry per package.
- Out: the merge and the publish (TK-073).
- Side effect: a version bump of the three packages. It needs the owner's approval when it runs (`AGENTS.md`,
  "Autonomy").

## Read first

- `02-structure.md#Release`: the version, the `fixed` group, `privatePackages`, the flow and the peer range.
- The Evidence section of TK-008: the approach that Changesets planned.

## Decisions to apply

- D46: make no prerelease of 0.7.0. Use no prerelease mode.
- D04: use the `fixed` group and one `minor` changeset. If Changesets plans another version, set the versions
  by hand.

## Acceptance

- [x] The three manifests and the three changelogs show 0.7.0.
- [x] `.changeset/pre.json` does not exist.
- [x] Each adapter's peer range on `@oxform/core` is `workspace:^`.
- [x] No private workspace has a new version or changelog.
- [x] `pnpm run build` and `pnpm run check:all` pass.

## Evidence

- Path: Changesets. The owner approved the bump on 2026-11-18. `pnpm run version:bump` consumed
  `.changeset/extension-api.md` and the `fixed` group set `@oxform/core`, `@oxform/react` and `@oxform/solid` to
  0.7.0 (solid came from 0.2.0). Each changelog has one 0.7.0 entry. No prerelease mode: `.changeset/pre.json`
  does not exist.
- The peer range of each adapter on `@oxform/core` stays `workspace:^`. No private workspace changed.
- Deviation: Changesets made its own commit, `RELEASING: Releasing 3 package(s)`. It is reworded as
  `chore: version the packages for 0.7.0` (`04901cd`) to follow the commit rules.
- `pnpm run build` (13/13) and `pnpm run check:all` exit 0.
