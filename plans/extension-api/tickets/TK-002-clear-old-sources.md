---
id: TK-002
title: Clear the old sources
phase: 1
work_package: P1-01
status: todo
depends_on: [TK-001]
branch: codex/P1-01-clear-old-sources
pr: null
started: null
completed: null
---

# TK-002: Clear the old sources

## Outcome

The 0.x sources, the old docs content and the root `postbuild` script are gone. Each workspace builds from one
placeholder module, and `pnpm run build` and `pnpm run check` pass.

## Scope

- In: delete `packages/*/{src,export,scripts}`, `examples/*/src` and `apps/docs/content/docs/{core,react,solid}`.
  Delete the root `postbuild` script. Add one placeholder module to each workspace that needs one to build.
  Delete `examples/react/CHANGELOG.md` (`02#Target workspace`, "What is deleted").
- In: `explorations/` stops building here. If `pnpm run check` fails on it (the root lint is type-aware and does
  not ignore `explorations/`), exclude the folder from lint and type checks, and record it.
- Out: the core manifest, the entry points and the pack configuration (TK-003). The adapter and example
  manifests (TK-008). The docs site skeleton and redirects (TK-058).

## Read first

- `02-structure.md#Target workspace`: the target tree and the table "What is deleted".
- `02-structure.md#Tooling and scripts`: `postbuild` is deleted.
- `02-structure.md#Deviations and decisions` 2: why `postbuild` goes.
- `04-documentation.md#10. Writing order and dependencies`: step 1 and the rule for today's docs folders.
- `06-roadmap.md#Deviations and decisions` 4: why the docs content goes in this ticket.

## Decisions to apply

- D08: delete the root `postbuild`. `check:format` covers the need.
- Write every placeholder new. Do not keep or move a 0.x file.

## Acceptance

- [ ] The paths of the scope are deleted, and `package.json` has no `postbuild` script.
- [ ] `pnpm run build` passes.
- [ ] `pnpm run check` passes.

## Evidence

Record the command results, how `explorations/` was handled, and any deviation from the plan here.
