---
id: TK-055
title: Comparison research closure
phase: 7
work_package: P7-08
status: done
depends_on: []
branch: codex/P7-08-comparison-research
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-055: Comparison research closure

## Outcome

No cell of the comparison is "Unverified". `07-comparison-features.json` has one record per matrix cell,
and each record has a primary source, a version and a read date.

## Scope

- In: each "Unverified" cell of `07#2.2`, `#2.3` and `#3.3`, resolved at a primary source or removed with its
  row. `07-comparison-features.json` with the fields of `07#5`.
- Out: the form versions (TK-056). The size data (TK-057). The page and its generated tables (TK-068).

## Read first

- `07-comparison.md#2.1`: the sources already read.
- `07-comparison.md#2.2`, `#2.3` and `#3.3`: the cells to resolve.
- `07-comparison.md#3.1`: the cell vocabulary and the rules for a row.
- `07-comparison.md#5`: the fields of `features.json`.
- `07-comparison.md#6.2`: a `readAt` older than 90 days makes the data stale.
- `07-comparison.md#8` item 7: the list of unverified facts.

## Decisions to apply

- No register decision applies. Apply the vocabulary and row rules of `07#3.1`.

## Acceptance

- [x] Each fact is read at a primary source: the library's own documentation, repository or the npm
      registry. No cell comes from memory or from another project's comparison.
- [x] Each resolved cell holds one value of the `07#3.1` vocabulary. A row with no value for all four
      libraries is removed.
- [x] `features.json` has no "Unverified" value. Each record has `source`, `version` and `readAt`.
- [x] The cells of `07#2.2`, `#2.3` and `#3.3` agree with `features.json`.
- [x] `pnpm run check:format` passes.

## Evidence

- `07-comparison-features.json`: 84 records (21 rows × 4 libraries) with `row`, `library`, `value`,
  `note`, `source`, `version` and `readAt`. No value is "Unverified", and no record lacks a source, version or
  date. Each fact was read on 2026-11-16 at the library's documentation, repository, npm registry or GitHub API.
- A script compared each record with its cell in `07#3.3`: 21 rows on both sides, 0 differences.
- `07#2.2`, `#2.3` and `#3.3` are updated. New sources T11, T12, R9, F11 and F12. Stars, downloads (week
  2026-11-09 to 2026-11-15) and two first-stable dates are new. The row "A form pays only for the features it
  imports" is removed, because no primary source states it for two libraries.
- Cells checked again by hand at the source: Formisch fields are uncontrolled by default
  (controlled-fields.md). TanStack Form lists seven frameworks (llms.txt). The React Hook Form downloads
  (63,860,985). TanStack `time["1.0.0"]` (2025-03-02). `@formisch/devtools` returns 404, and
  `formisch.dev/llms.txt` does not name devtools.
- The cells that rest on a judgement (rows 9, 10, 12, 13 and 15) are in `reports/extension-api-rebuild.md`.
- `pnpm run check:format` passes.
- The research ran in a background agent, with this ticket's rules. I checked its result as stated above.
