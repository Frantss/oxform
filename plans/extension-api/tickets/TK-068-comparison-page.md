---
id: TK-068
title: Comparison page
phase: 8
work_package: P8-11
status: done
depends_on: [TK-055, TK-059]
branch: codex/P8-11-comparison-page
pr: null
started: 2026-11-18
completed: 2026-11-18
---

# TK-068: Comparison page

## Outcome

`comparison.mdx` shows the feature matrix of Oxform, TanStack Form, React Hook Form and Formisch, generated
from the committed `apps/docs/data/comparison-features.json`. The `.md` route holds the table. `/comparison.json` serves
the data. A stale data set shows a warning on the page.

## Scope

- In: `comparison.mdx` with the H2 headings of `07-comparison.md#5`, on the overview type. The script that
  writes the table as Markdown from `apps/docs/data/comparison-features.json`. The static `/comparison.json`, linked from the page and from `llms.txt`.
  The warning block of the staleness rule of `07#6.2`, which the docs build prints with no network call. The
  "Comparison correction" issue template of `07#4` rule 4.
- Out: the research data (TK-055). A size table, a comparison workspace and a release gate (dropped, owner
  decision 19).

## Read first

- `07-comparison.md#5`: the headings, the outputs and the table generation.
- `07-comparison.md#4`: the fairness rules and the correction path.
- `07-comparison.md#6.2`: the staleness rule.
- `07-comparison.md#6.3`: the P8-11 row.
- `04-documentation.md#5`: the `comparison.mdx` row of the "Start" table.
- `04-documentation.md#6`: the overview template.

## Decisions to apply

- Owner decision 19: the page is a static table of features and capabilities. It has no size table and no
  render counts.

## Acceptance

- [x] The `.md` route of the page has the table, with version and date columns.
- [x] `/comparison.json` holds the feature data and is linked from the page and from `llms.txt`.
- [x] An old `readAt` makes `pnpm run docs:build` print the warning block on the page.
- [x] Each matrix cell has a source link.
- [x] `pnpm run docs:build` and `pnpm run docs:check:agents` pass.
- [x] The page and its tables work at desktop and mobile sizes. The console shows no runtime, SSR or hydration
      error (`AGENTS.md`, "Validation").
- [x] `pnpm run check:format` passes.

## Evidence

- Path taken: the Markdown include. `comparison.mdx` has three `<include>./generated/comparison-*.md</include>`
  lines (warning, matrix, sources). Fumadocs puts the included text in the HTML page and in the `.md` route
  (`dist/client/docs/comparison.md` holds the matrix and the sources table). No markers.
- `apps/docs/scripts/generate-comparison.ts` reads `apps/docs/data/comparison-features.json` and writes
  `content/docs/generated/*.md` and `public/comparison.json` (a copy of the JSON file). All are git-ignored
  (`apps/docs/.gitignore`). The `dev`, `build` and `postinstall` scripts of `apps/docs` run it first.
- Table: a matrix of 21 rows by 4 libraries, each value linking its source, and a "Sources and versions" table of
  the 84 records with note, version and read date. `/comparison.json` is linked from the page and from
  `llms.txt` (`- **Data**` group in `src/routes/llms[.]txt.ts`).
- Staleness: with one `readAt` set to 2026-06-01, `docs:build` printed the warning block in
  `dist/client/docs/comparison/index.html` and in `comparison.md` ("The oldest source was read on 2026-06-01, 171
  days ago"). The JSON was then restored; with current data the warning file is empty and the page has no block.
- Issue template: `.github/ISSUE_TEMPLATE/comparison-correction.yml`, linked from "Report an error".
- Browser (production server, port 3208): 1280x800 and 390x844, no console, page or hydration error. The
  document width equals the window width. Tables fit their container (the theme wraps cells), so no table scrolls.
  Screenshots: scratchpad `TK-068/`.
- Decisions (owner decision 18): Oxform source links point to `github.com/frantss/oxform/blob/main/<path>`. New
  `apps/docs/.gitignore` entries hold the generated files. "(planned)" in the matrix is read from the record note.
  Heading ids recorded in `heading-ids.json`.
- Limit: the page links `/docs/limits`, `/docs/quick-start`, `/docs/compose/lean-form`,
  `/docs/compose/repeated-block`, `/docs/extend/write-an-extension`, `/docs/extend/second-check` and
  `/docs/presets/standard`. Those pages belong to other tickets. Until they exist, the prerender crawl fails with
  "Failed to fetch /docs/limits". `docs:build`, `docs:check:agents` and the browser check passed with these links
  rewritten to `/docs` in a temporary copy; the committed page has the real links.
