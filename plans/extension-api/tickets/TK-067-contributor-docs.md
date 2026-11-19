---
id: TK-067
title: Contributor documents
phase: 8
work_package: P8-10
status: in-progress
depends_on: [TK-047, TK-059]
branch: codex/P8-10-contributor-docs
pr: null
started: 2026-11-18
completed: null
---

# TK-067: Contributor documents

## Outcome

`docs/*.md`, the `AGENTS.md` section and every readme describe the new structure and commands. Each command in
`docs/commands.md` runs. `docs/form-core-behaviors.md` and `docs/checks-and-issues.md` are deleted.

## Scope

- In: the rows of `04-documentation.md#9`. Rewrite `docs/structure.md`, `docs/commands.md`, `docs/testing.md`,
  `docs/typescript.md` and `docs/code-style.md`. Complete `docs/architecture.md` from the TK-060 draft. Add
  `docs/adapter-authors.md`. Delete the two 0.x behavior documents. Rewrite the "Oxform-specific guidance"
  section of `AGENTS.md`. Rewrite `readme.md`, `packages/core/readme.md`, `packages/react/readme.md`,
  `packages/solid/readme.md`, `apps/docs/README.md` and `examples/*/readme.md`. Each package readme links the
  site's `llms.txt`.
- Out: the general sections of `AGENTS.md`, `explorations/**` and `reports/*.md` (kept as is, `04#9`). The
  health check line of `apps/docs/README.md` (TK-058). The in-package `docs/` folders (stage B, recorded by
  TK-074). The plan files.

## Read first

- `04-documentation.md#9`: the action and the reason for each file, and the one-place rule.
- `04-documentation.md#7.4`: stage A, the readme link.
- `02-structure.md#Contributor-doc impact`: what becomes wrong in each document.
- `02-structure.md#Tooling and scripts`, `02-structure.md#Release` and `02-structure.md#CI`: the commands to
  document.
- `03-testing.md#Deviations and decisions`: item 11, the condition to delete the two documents.
- `01-public-api.md#7.1` and `#7.2`: the naming rule and the adapter contract.

## Decisions to apply

- D40: ship stage A at 0.7.0. Each package readme links the site. Ship no `docs/` folder in a package.
- D41: delete `docs/form-core-behaviors.md` and `docs/checks-and-issues.md` when every `B:` and `C:` row has a
  passing test.
- D48: keep the `oxform-*` deprecation notice in the root readme as one line.

## Acceptance

- [x] Each command in `docs/commands.md` runs as documented. Record each result.
- [x] Every `B:` and `C:` row of `03-testing.md` has a passing test, and the two documents are deleted.
- [x] No file links a deleted document or `plans/extension-api/`.
- [x] `AGENTS.md` "Validation" names `docs:check:agents`, and its guide list names only existing files.
- [x] `pnpm run check:terms` passes on `docs/*.md`.
- [x] `pnpm run check:format` passes.

## Evidence

Status stays `in-progress`: `docs/architecture.md` (TK-060 draft) is not completed yet. The coordinator sends a
follow-up after TK-060 lands. `AGENTS.md` already lists it and links it, so that one link is dead until then.

Commands of `docs/commands.md`, run from the worktree root (ports 3207, never 3002):

| Command                                                                       | Result                                                                                   |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm install`, `pnpm run build`                                              | exit 0 (12 of 12 tasks)                                                                  |
| `pnpm run build:dev`                                                          | started, rebuilt core in 392 ms, watching after 40 s, stopped                            |
| `pnpm run docs:dev -- --port 3207`                                            | `/docs` 200, then stopped                                                                |
| `PORT=3207 pnpm run docs:start`                                               | `/docs` 200, `/llms.txt` 200, then stopped                                               |
| `pnpm run docs:build`, `docs:check`, `docs:check:agents`                      | exit 0 ("1 pages and 7 templates pass")                                                  |
| `pnpm --dir apps/docs run playground:build`                                   | exit 0                                                                                   |
| `pnpm --dir examples/{react,solid,solid-v2} run dev -- --port 3207`           | `/` 200 each, then stopped                                                               |
| `pnpm run test`, `test:coverage`                                              | exit 0 (core 404 tests; coverage 377 tests, 98.71% statements)                           |
| `pnpm --dir packages/core run test run src/behaviors/check.spec.ts`           | 28 passed                                                                                |
| `pnpm --dir packages/core run test -t "keeps form pristine"`                  | 1 passed                                                                                 |
| `pnpm --dir packages/react run test:ssr`, `packages/solid run test:ssr`       | exit 0                                                                                   |
| `pnpm --dir packages/solid-v1 run test`, `solid-v2 run test`                  | exit 0                                                                                   |
| `pnpm --dir packages/core run test:dev`                                       | watching after 12 s (404 passed), stopped                                                |
| `pnpm run check:rules`, `check:format`, `check:types`                         | exit 0                                                                                   |
| `pnpm run check`, `check:terms`, `check:package`, `check:parity`, `check:all` | exit 0                                                                                   |
| `pnpm run fix:rules`, `fix:format <file>`                                     | exit 0, no other file changed                                                            |
| `pnpm run version:add`                                                        | opens the interactive prompt (stopped, no file written)                                  |
| `changeset version --help`, `changeset publish --help`                        | help prints. `version:bump` and `publish` were not run (they change versions or publish) |

`B:` and `C:` rows (47 rows of `03-testing.md` that cite them). All pass in `pnpm --dir packages/core run test run
src/main/form.spec.ts src/main/effect.spec.ts src/behaviors` (13 files, 317 tests). Specs are in
`packages/core/src/`; "describe > case":

- 1 `main/form.spec.ts` defineForm > takes values from defaultValues, gives each instance its own state.
- 2, 3 `main/effect.spec.ts` createEffect > first selection, each change, deeply equal, unsubscribe, overlapping async runs.
- 4 to 6 `behaviors/values.spec.ts` values > reads the whole object and a path, updater, keeps the siblings of a written
  path (added), starts from `defaultValues`, later `defaultValues` kept, schema transformation never replaces values.
- 7 to 14 `behaviors/validation.spec.ts` validation results, validation targets, validation events, stale runs, rejected
  runs, validating, plus the type case `tests/types/behaviors.test-d.ts` ValidatorInput (no status).
- 15 to 20 `behaviors/check.spec.ts` an exclusive check, a check that is not exclusive, check.set, blocking, root issues.
- 21 to 25 `behaviors/status.spec.ts` field marks, valid, default status (form pristine with submit dirty).
- 26 to 29 `behaviors/events.spec.ts` change, focus and blur, requested validation (returns before validation settles),
  register and unregister.
- 30 to 35 `behaviors/arrays.spec.ts` append, prepend and insert; swap and move; update; remove; replace; array marks.
- 36 to 40 `behaviors/reset.spec.ts` reset.all, reset.at, reset and validation.
- 41 to 46 `behaviors/submit.spec.ts` submit.run, concurrent submits, aborted submits, rejected submits.
- 47 `behaviors/handles.spec.ts` field handles, array handles.

One row had no test: "write one path by value or updater, siblings kept" (row 4). Added the small case
`values > keeps the siblings of a written path` in `packages/core/src/behaviors/values.spec.ts`.

Links: `grep` for `form-core-behaviors`, `checks-and-issues` and `plans/extension-api` outside `plans/` and `reports/`
finds no link. Two links in `explorations/behavior-api/` (`proposal.md:416`, `tickets/tk-007-lane-race-specs.md:8`)
became plain text. Two code comments name the plan (`vite.config.ts:41`, `apps/docs/scripts/check-agents.ts:8`). They
are outside this ticket's files and are not links.

Decisions (owner decision 18):

- The site address in the package readmes is `https://oxform.frantss.uy` (the production domain of
  `apps/docs/cloudflare.config.ts` on the integration checkout). The readmes link `/llms.txt` there.
- The glossary lives in `docs/code-style.md#glossary`, because no other contributor document holds it. `AGENTS.md`
  links it.
- The commands document names only scripts that exist. The plan names `check:tree-shaking`, `report:size`,
  `test:package`, `check:test-*`, `check:consumers` and `bench`. They are not in any `package.json`, so they are not
  documented (TK-033 is dropped).
- `docs/testing.md` keeps its text, and fixes the example paths, a snippet and the file placement table.
- `check:terms` does not scan the root or package readmes. A one-off scan with `findForbiddenTerms` found no term.
- Added `examples/react/readme.md`. The kit has no readme.
