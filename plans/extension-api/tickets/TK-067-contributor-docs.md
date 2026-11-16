---
id: TK-067
title: Contributor documents
phase: 8
work_package: P8-10
status: todo
depends_on: [TK-047, TK-059]
branch: codex/P8-10-contributor-docs
pr: null
started: null
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

- [ ] Each command in `docs/commands.md` runs as documented. Record each result.
- [ ] Every `B:` and `C:` row of `03-testing.md` has a passing test, and the two documents are deleted.
- [ ] No file links a deleted document or `plans/extension-api/`.
- [ ] `AGENTS.md` "Validation" names `docs:check:agents`, and its guide list names only existing files.
- [ ] `pnpm run check:terms` passes on `docs/*.md`.
- [ ] `pnpm run check:format` passes.

## Evidence

Record the result of each command in `docs/commands.md`, the check results and any deviation from the plan
here.
