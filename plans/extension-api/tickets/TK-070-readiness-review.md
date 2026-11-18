---
id: TK-070
title: Readiness review
phase: 9
work_package: P9-01
status: todo
depends_on:
  [
    TK-002,
    TK-003,
    TK-004,
    TK-005,
    TK-006,
    TK-007,
    TK-008,
    TK-009,
    TK-010,
    TK-011,
    TK-012,
    TK-013,
    TK-014,
    TK-015,
    TK-016,
    TK-017,
    TK-018,
    TK-019,
    TK-020,
    TK-021,
    TK-022,
    TK-023,
    TK-024,
    TK-025,
    TK-026,
    TK-027,
    TK-028,
    TK-029,
    TK-030,
    TK-031,
    TK-032,
    TK-033,
    TK-034,
    TK-035,
    TK-036,
    TK-037,
    TK-038,
    TK-039,
    TK-040,
    TK-041,
    TK-042,
    TK-043,
    TK-044,
    TK-045,
    TK-046,
    TK-047,
    TK-048,
    TK-049,
    TK-050,
    TK-051,
    TK-052,
    TK-053,
    TK-055,
    TK-058,
    TK-059,
    TK-060,
    TK-061,
    TK-062,
    TK-063,
    TK-064,
    TK-065,
    TK-066,
    TK-067,
    TK-068,
  ]
branch: codex/P9-01-readiness-review
pr: null
started: null
completed: null
---

# TK-070: Readiness review

## Outcome

Each item of the definition of done for 0.7.0 has evidence, or names the ticket that closes it. The size
report, the comparison data, the decision register and the benchmark numbers are checked against the built
packages.

## Scope

- In: one line of evidence per item of `06-roadmap.md#Definition of done for 0.7.0`: a command result, a file
  path or the Evidence section of a ticket. Check that each decision of the register is applied by the work
  package in its "Applied in" column, and that each accepted limit is on `limits.mdx`. Check that the size
  report, `07-comparison-features.json` and the benchmark numbers in `reports/` match the current
  build. Run the items that need `main` or the registry on the integration branch, and name the ticket that
  closes them: TK-071 (`explorations/` deleted) and TK-073 (`main`
  and the registry).
- Out: fixing a failed item. A failed item goes back to its ticket, and this review runs again. Deleting
  `explorations/` (TK-071). The version, the merge and the publish (TK-072, TK-073).

## Read first

- `06-roadmap.md#Definition of done for 0.7.0`: the checklist.
- `06-roadmap.md#Decision register`: the "Applied in" column.
- `06-roadmap.md#Phase 9: release 0.7.0 and cleanup`: the phase exit criteria.
- `04-documentation.md#5.2`: the limits that `limits.mdx` must state.
- `03-testing.md#Size report` and `03-testing.md#Performance`: where the numbers are.

## Decisions to apply

- None. This ticket checks that every decision D01 to D54 is applied.

## Acceptance

- [ ] Each checklist item of the definition of done has evidence or a named closing ticket.
- [ ] Each decision of the register has evidence in the ticket of its "Applied in" work package.
- [ ] `pnpm run build`, `pnpm run check:all`, `pnpm run test` and `pnpm run docs:check:agents` pass on the
      integration branch.
- [ ] `pnpm run check:format` passes.

## Evidence

Record the checklist with one line of evidence per item here.
