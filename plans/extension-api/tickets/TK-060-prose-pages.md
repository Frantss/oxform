---
id: TK-060
title: Prose with no code
phase: 8
work_package: P8-03
status: todo
depends_on: [TK-059]
branch: codex/P8-03-prose-pages
pr: null
started: null
completed: null
---

# TK-060: Prose with no code

## Outcome

The introduction, the API decision tables, the known limits and the text of each concept page exist and use
only glossary terms. A first draft of `docs/architecture.md` describes the internal design for contributors.

## Scope

- In: `index.mdx`, `choose-an-api.mdx` and `limits.mdx`. The "In short", "Model" and "Rules" sections of each
  `concepts/*` page. Each limit of `04-documentation.md#5.2` on `limits.mdx`, with symptom, cause and what to
  do. The `docs/architecture.md` draft. The concept pages keep "Example" empty and stay hidden from the
  sidebar (`04#10`, rules).
- Out: the examples of `concepts/*` (TK-061). The E06 example of `index.mdx` has no owner ticket. The
  "Common mistakes" rows on the pages where a limit occurs (the ticket of each page). `comparison.mdx`
  (TK-068). `quick-start.mdx` (TK-064). The final `docs/architecture.md` (TK-067).

## Read first

- `04-documentation.md#5`: the "Start" and `concepts/` tables.
- `04-documentation.md#5.2`: the limits and where each is stated.
- `04-documentation.md#6`: the overview and concept templates and the content rules per heading.
- `04-documentation.md#7.3`: the page rules.
- `04-documentation.md#9`: the `docs/architecture.md` row.
- `04-documentation.md#10`: step 4.
- `00-direction.md#Principles`, `00-direction.md#Glossary` and `00-direction.md#Packages and entry points`.
- `01-public-api.md#2.1`, `#3.1` and `#3.2`: the names and the needs.

## Decisions to apply

- D42: add `docs/architecture.md`.
- D21: if check names stay `string` (TK-021 records it), `limits.mdx` states it.
- D25: if a scope of the wrong shape is not rejected (TK-027 records it), `limits.mdx` states it.

## Acceptance

- [ ] Each limit of `04#5.2` is on `limits.mdx`, and each limit that TK-021 or TK-027 accepted is there too.
- [ ] `choose-an-api.mdx` holds decision tables only.
- [ ] Each page has the frontmatter and the fixed headings of its type.
- [ ] `pnpm run docs:check:agents` passes.
- [ ] `pnpm run docs:build` and `pnpm run check:format` pass.
- [ ] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").

## Evidence

Record the command results, the browser check and any deviation from the plan here.
