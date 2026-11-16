---
id: TK-059
title: Agent outputs
phase: 8
work_package: P8-02
status: todo
depends_on: [TK-058]
branch: codex/P8-02-agent-outputs
pr: null
started: null
completed: null
---

# TK-059: Agent outputs

## Outcome

The site serves `/llms.txt`, `/llms-full.txt` and a Markdown form of each page, and each HTML page has page
actions. `pnpm run docs:check:agents` and `pnpm run check:terms` run in `check:all` or CI and fail on a broken
page or a forbidden term. Each docs tool check has a recorded result.

## Scope

- In: the outputs of `04-documentation.md#7.2`: the index, the full text, the page Markdown route with
  `includeProcessedMarkdown` and `rewritePath`, content negotiation, and the page actions.
  `apps/docs/scripts/check-agents.ts` with every check of `04#7.5`, the `check:agents` script of
  `@oxform/docs`, the root `docs:check:agents`, and the committed list of heading ids. `scripts/check-terms.ts`
  and the root `check:terms`, with the term list of `04#7.3` rule 9 kept in one place for both checks. Add
  `check:terms` to `check:all`, `check:terms` and `docs:check:agents` to CI in the order of `02#CI`, and
  `docs:check:agents` to `prepublish` (`02#Tooling and scripts`). The tool checks of `04#7.2` (items 1 to 4)
  and the `<include>` check of `04#8`.
- Out: page content (TK-060 to TK-068). `compare:check` in `prepublish` (TK-069). The in-package `docs/`
  folders and `docs:package` (stage B, D40, recorded by TK-074). An MCP server, per-section indexes and a
  skill (D47).

## Read first

- `04-documentation.md#7.2`: the outputs, the helpers that generate them and the four verification tasks.
- `04-documentation.md#7.3`: the page rules, and rule 9 for the term list.
- `04-documentation.md#7.5`: the checks of `docs:check:agents`.
- `04-documentation.md#8`: Twoslash on an included block, and its fallback.
- `04-documentation.md#11`: decision 10, the tool behavior to verify.
- `02-structure.md#Tooling and scripts` and `02-structure.md#CI`: the scripts, `check:all`, `prepublish` and
  the CI step order.
- `00-direction.md#Glossary`: the terms the checks allow.
- `reports/fumadocs-typescript.md` and `reports/fumadocs-twoslash.md`: the known tool faults to recheck.

## Decisions to apply

- D47: build no MCP server, no skill, no per-section index and no versioned site.

## Acceptance

- [ ] `pnpm run docs:check:agents` passes after `pnpm run docs:build`.
- [ ] Each check of `04#7.5` fails on a planted fault: an empty `.md` output, a dead `llms.txt` link, a
      missing fixed heading, a block with no `twoslash`, a `---cut---`, a forbidden term, a removed heading id.
- [ ] `pnpm run check:terms` fails on a forbidden term in `packages/*/src` and allows `OptionKind` and
      "option kind". `pnpm run check:all` runs it.
- [ ] CI runs `check:terms` and `docs:check:agents` in the order of `02#CI`.
- [ ] The three text routes are prerendered, and the `.md` route answers `Accept: text/markdown` on the srvx
      server.
- [ ] Each of the four tool checks of `04#7.2` and the `<include>` check of `04#8` has a recorded result.
- [ ] The page actions work at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run check:format` pass.

## Evidence

Record the command results and the browser check here. R07 has fallbacks: if the text routes are not
prerendered, add them to the prerender page list (`04#7.2` item 1). If type tables are missing from the
Markdown, set `mdxAsPlaceholder` (item 3). If an included block cannot carry `twoslash`, mark it
`no-check="checked in the example kit"` (`04#8`). Record which path each check took, and append the tool
findings to the matching report in `reports/`.
