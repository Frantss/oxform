# Agents

## Coding standards

1. **YAGNI**: Do not build it until it is needed.
2. **DIE**: Extract duplicated patterns when a shared implementation simplifies maintenance.
3. **KISS**: Build the obvious solution first. Optimize when measurements or explicit requirements show a need.
4. **SOLID**: Check your solutions against the 5 SOLID principles.
5. **Delete aggressively**: Remove code that you can verify is unused or unnecessary for required behavior. Aim for simplicity.
6. **The Boy Scout Rule**: Refactor as needed. If the refactor is out of scope, report the opportunity.
7. **Semantic naming**: Use self-documenting names. Prefer descriptive, unambiguous names over abbreviated names.
8. When these coding standards conflict, prefer the simplest approach. Justify added complexity in terms of task requirements or project constraints.

## Communicating

- Use clear English guided by ASD-STE100.
- Avoid preamble.
- Start each response with a direct answer to the user's request.
- End each response with brief **Goal**, **Done**, **Next**, and **Needs you**. Drop each if nothing to show.

## Autonomy

- Weigh blast radius. After approval, proceed with small, reversible changes. Present a proposal before requesting approval for architectural or cross-cutting changes.
- Request approval before running any action with side effects.
- After approval, fix encountered bugs directly related to your work and report the fixes afterwards. Apply the same proposal requirement to architectural or cross-cutting bug fixes.

## Context management

- Keep the main context focused on the goal, constraints, decisions, and integration.
- When sub-agents are available and permitted, delegate bounded research, code exploration, implementation, reviews, and output-heavy checks. Handle trivial operations directly when delegation adds more overhead than it removes.
- Give each sub-agent a clear goal, relevant context, constraints, and completion criteria. Pass only the context needed for its task.
- Require a concise summary of results, evidence references, verification outcomes, and unresolved issues. Keep detailed searches, logs, and intermediate output in the sub-agent's context.
- Verify consequential conclusions against the referenced evidence. Read additional details when needed to resolve uncertainty or integrate changes.
- Give concurrent sub-agents separate edit ownership. Coordinate work that depends on shared files or results.

## Proposing solutions

- Propose at least two viable approaches.
- For each viable approach, state how the change can be verified once implemented.
- For each viable approach, state the **risks** it poses and how to mitigate them.
- Briefly state rejected approaches.
- When only one viable approach exists, present that approach without manufacturing alternatives. Still explain verification and risks, and check the approach against our coding standards.
- Check your proposal against our [coding standards](#coding-standards).

## Before changing code

- Read the relevant module documentation and code.
- Identify the intended behavior and constraints that must remain as is.

## Before reporting completion

- If code was written, check it against our [coding standards](#coding-standards).
- Run checks proportional to the change. Report their results and explain any skipped checks.
- Collect evidence of the changed behavior and identify any remaining limitations.
- Apply the [documentation rules](#writing-documentation) to the change.

## Writing documentation

- Write documentation only when requested or when necessary usage, setup, or maintenance guidance would otherwise be missing or inaccurate.
- Keep each document focused on one purpose. Include only what the reader needs for that purpose.
- Prefer updating the relevant existing document. Keep each fact in one place and avoid restating details already clear from code or configuration.
- Remove obsolete or redundant text in documentation you touch.

## Git & GitHub

- Use conventional commits (`feat:`, `chore:`, `docs:`, ...).
- Keep the commit's subject on one line.
- When committing, give each commit one purpose. Include the implementation, tests, and documentation required for that purpose. Put independent changes in separate commits.
- When both tools support the operation, prefer `gh` over `git`.

## Oxform-specific guidance

Oxform is a TypeScript monorepo for a framework-agnostic form library with React and Solid
bindings, using pnpm workspaces. Use pnpm for development.

Read `readme.md`, then the relevant package readme and code. This file defines how
to work; the guides below document the project.

### Project context

- Anything checkable, including an API, version, configuration, or why a line
  exists, gets checked at the source: `package.json`, `pnpm-lock.yaml`, configuration
  files, source files, git history, and documentation matching the dependency
  version. Consult TypeScript, React, TanStack Store, Standard Schema, Vite+,
  Vitest, and Playwright documentation as relevant; for the docs app, also
  TanStack Start/Router, Fumadocs, and Tailwind CSS. Verify prerelease behavior
  against the installed version rather than assuming stable-release behavior.
- Read the relevant guides before changing their area:
  - [Structure](./docs/structure.md): workspace layout and package relationships.
  - [Commands](./docs/commands.md): development, validation, and release commands.
    Confirm commands against the current package scripts and CLI help.
  - [Checks and issues](./docs/checks-and-issues.md): check and issue validation behavior.
  - [Form core behaviors](./docs/form-core-behaviors.md): expected form method behavior.
  - [Testing](./docs/testing.md): Vitest and Playwright browser testing patterns.
  - [TypeScript](./docs/typescript.md): type patterns and API design.
  - [Code style](./docs/code-style.md): imports, formatting, and naming.

### Findings

Findings go in `reports/<topic>.md`, one file per topic. Append to existing
reports. State what the finding is, where it is (`path:line`), and why it matters.

### Commands

Run from the repo root unless a package directory is specified. Root scripts use
Vite+ (`vp`); lint and formatting use Oxlint and Oxfmt, not ESLint or Prettier.

```bash
pnpm run build           # build all workspaces
pnpm run build:dev       # watch mode
pnpm run check:types     # type-check all workspaces
pnpm run check:all       # lint, format, types, and package validation
pnpm run test            # run core, React, Solid, and all example tests once
pnpm run fix:all         # auto-fix lint and format
pnpm run fix:format AGENTS.md  # format a specific file

# Run a single test through the package's Vite+ script
cd packages/<name> && pnpm run test run src/tests/file.spec.ts

# Run browser-facing workspaces
pnpm run docs:dev
pnpm --dir examples/react run dev
```

### Validation

- For code or configuration changes, run `pnpm run build`, `pnpm run check:all`,
  and `pnpm run test`, unless a command is irrelevant or blocked. Build before
  package validation so it can inspect the generated exports.
- Run formatting before finishing. Limit formatting to files changed for the
  task; inspect the diff and preserve unrelated edits.
- For browser-facing changes, run the affected docs or example application and
  verify the affected flow at relevant desktop and mobile sizes. Check the
  browser console for runtime failures and, for the docs app, SSR and hydration
  failures.
- Report faithfully. Failures include their output; skipped steps are named.
  Unverified work is never called done. Documentation-only work needs formatting
  and link checks; builds, type checks, tests, and browser verification are
  unnecessary unless the documentation change affects them.

### Git conventions

- Use lowercase commit subjects.
- Use descriptive, hyphenated branch names with the `codex/` prefix.
