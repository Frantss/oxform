---
id: TK-060
title: Prose with no code
phase: 8
work_package: P8-03
status: done
depends_on: [TK-059]
branch: codex/P8-03-prose-pages
pr: null
started: 2026-11-18
completed: 2026-11-18
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

- [x] Each limit of `04#5.2` is on `limits.mdx`, and each limit that TK-021 or TK-027 accepted is there too.
- [x] `choose-an-api.mdx` holds decision tables only.
- [x] Each page has the frontmatter and the fixed headings of its type.
- [x] `pnpm run docs:check:agents` passes.
- [x] `pnpm run docs:build` and `pnpm run check:format` pass.
- [x] The pages render at desktop and mobile sizes. The console shows no runtime, SSR or hydration error
      (`AGENTS.md`, "Validation").

## Evidence

- Pages: `index.mdx` (rewritten), `choose-an-api.mdx`, `limits.mdx` and the eight `concepts/*.mdx` (new), from the
  `overview` and `concept` templates. Frontmatter on each, with the catalogue ids of the site map on the concept
  pages. "Example" and "Common mistakes" of each concept page are present and empty. "Related" holds links to the
  pages of this ticket only, so no link is dead. `meta.json` is unchanged: `choose-an-api`, `limits` and the
  concepts stay hidden (`!`).
- `docs/architecture.md` (draft): modules, forms and chains (how `extend` tells a preset from an extension:
  `chains.has(result)`), instance creation, the context, state factories, internal channels and the validation
  link, the change path, validation runs, derived status, slots, scopes. Each fact read from
  `packages/core/src`.
- `limits.mdx` holds the 20 limits of `04#5.2`, and also: a generic preset that adds an option needs casts, `dirty`
  stays set (E02), `reset.all({ values })` keeps the first defaults (E23), a name from a parameter needs casts, a
  state that starts with `null` needs a return type (`01#7.5`, items 1 and 6), and `text` after `state` (brief).
- TK-021 and TK-027 accepted no limit: D21 types the check names from the chain, and D25 rejects a scope of
  another shape. So `limits.mdx` has no row for either.
- Checked against the built packages with a probe in `examples/kit/src` (deleted after): the preset-overload error
  text ("The last overload gave the following error"), `configure` before `.extend` (TS2353), a duplicate option
  (`DuplicateOption`, TS2339 on the next member), a check after `handles` (TS2339), an unknown option (TS2353), a
  partial scope default (TS2741), a `null` state (TS2322), and `text` before a `state` that reads its parameters
  (state `{}`, TS2339). With a `state` that takes no parameter, the order does not matter, so the page states the
  condition.
- `pnpm run build`: 12/12. `pnpm run docs:build`: pass. `pnpm run docs:check:agents`: 11 pages and 7 templates pass.
  `check:agents --record-heading-ids`: 93 ids. `pnpm run check:all`: exit 0. `pnpm run check:terms`: no forbidden term. `pnpm run check:format`:
  pass.
- Browser (production server, port 3201, Playwright 1.64.1): the 11 pages at 1280x800 and 390x844 return 200, show
  their title, have no horizontal page scroll, and log no console error, page error or hydration warning.
- Deviations and decisions (owner decision 18):
  - `04#5.2` says a duplicate option name throws at `.extend`. The source makes it a type error only (owner,
    2026-11-16, `reports/extension-api-rebuild.md`, "Option kinds"). `limits.mdx` states the source.
  - `index.mdx` has no E06 example: no ticket owns it. The page is prose and tables, and `examples` is empty.
  - The Lightweight row of `index.mdx` names no CI tree-shaking check: TK-033 is dropped, and no such script
    exists now.
  - Not on `limits.mdx`: the Solid workspace types finding (a consumer has one `solid-js`), the unhandled
    rejection of `events` without `onError` (documented behavior of the option, for `behaviors/events`), and the
    adapter rows G12 and G14 (for the adapter pages).
  - `entry` is `[]` on `index.mdx`, which imports nothing. `choose-an-api` and `limits` name the three core entry
    points that their rows use.
