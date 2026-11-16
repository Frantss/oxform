---
id: TK-002
title: Clear the old sources
phase: 1
work_package: P1-01
status: done
depends_on: [TK-001]
branch: codex/P1-01-clear-old-sources
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] The paths of the scope are deleted, and `package.json` has no `postbuild` script.
- [x] `pnpm run build` passes.
- [x] `pnpm run check` passes.

## Evidence

- Deleted: `packages/*/{src,export,scripts}`, `examples/*/src`, `apps/docs/content/docs/{core,react,solid}`,
  `examples/react/CHANGELOG.md` and the root `postbuild` script.
- Placeholders, all new: `export {};` in `packages/{core,react,solid,solid-v1,solid-v2}/export/index.ts`. A
  `main.tsx` and a `playground.tsx` in each of `examples/{react,solid,solid-v2}/src`, which render one line of
  text. One page in `apps/docs/content/docs/index.mdx`.
- Manifest entries that pointed to deleted files are removed: the `#…` aliases of `@oxform/react`,
  `@oxform/solid-v2` and the Solid examples, the `check:test-*` scripts of core, and `assemble.ts` and
  `check-consumers.ts` in `@oxform/solid` (`build` now builds the two private workspaces only; TK-008 writes
  the assembly). The `fmt` ignore entry of the deleted hydration fixture is removed.
- Docs app: the deleted pages and `routes/docs.index.tsx` (a redirect to `/docs/react`) are gone, so the links
  point to `/docs`, and the playground lists one placeholder per framework. `routeTree.gen.ts` is regenerated
  by the build. TK-058 owns the real site skeleton.
- `explorations/`: `pnpm run check` failed on it in the type-aware lint (unresolved imports of the old core),
  so `explorations/**` is in `lint.ignorePatterns`. `tsc` never checked it (no workspace includes it).
- `ORCHESTRATION.md`, merged from `main`, was not formatted, which failed `check:format`. It is formatted in
  its own commit.
- `pnpm run build`: 11 of 11 tasks pass. `pnpm run check`: lint, format and 10 type checks pass.
- Not in scope and expected to fail until later tickets: `pnpm run test` (no spec files, TK-007 and TK-008)
  and `pnpm run check:package` (placeholder manifests, TK-003 and TK-008).
