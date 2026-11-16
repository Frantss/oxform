# Tickets

Status: draft, revision 2. This file agrees with [06-roadmap.md](./06-roadmap.md), revision 4. It is the index
of the ticket files in [tickets/](./tickets/). `06-roadmap.md` owns the scope, the order, the verification and
the exit criteria of each work package. Each ticket file owns its outcome, scope, decisions, acceptance and
evidence.

## Overview

- Each ticket completes one work package of `06-roadmap.md`, or two where its `work_package` field lists two.
- Every work package, every decision row D01 to D54 and every script gap 1 to 12 has a ticket.
- A ticket's `status` is `todo`, `in-progress` or `done`. The index shows a `todo` ticket as `ready` when every
  ticket in its `depends_on` is `done`, and as `blocked` otherwise.
- A ticket branch is `codex/<work-package-id>-<slug>` (D01).
- The tables below are generated. Do not edit them. After a change to a ticket's frontmatter, run:

  ```bash
  node plans/extension-api/scripts/tickets-index.ts
  pnpm exec vp fmt plans/extension-api/08-tickets.md
  ```

## Tickets

<!-- tickets:start -->

### Phase 0: the reference and the integration branch

| Id                                                 | Title                                | Work package | Status | Depends on |
| -------------------------------------------------- | ------------------------------------ | ------------ | ------ | ---------- |
| [TK-001](./tickets/TK-001-reference-and-branch.md) | Reference tag and integration branch | P0-03, P0-04 | done   | None       |

### Phase 1: workspace skeleton and packaging proof

| Id                                                   | Title                                               | Work package | Status | Depends on     |
| ---------------------------------------------------- | --------------------------------------------------- | ------------ | ------ | -------------- |
| [TK-002](./tickets/TK-002-clear-old-sources.md)      | Clear the old sources                               | P1-01        | done   | TK-001         |
| [TK-003](./tickets/TK-003-core-manifest.md)          | Core manifest and pack                              | P1-02        | done   | TK-002         |
| [TK-004](./tickets/TK-004-module-sharing.md)         | Module-sharing proof                                | P1-03        | done   | TK-003         |
| [TK-005](./tickets/TK-005-tree-shaking-proof.md)     | Tree-shaking proof and size report                  | P1-04        | done   | TK-003         |
| [TK-006](./tickets/TK-006-dependency-lint.md)        | Dependency-direction lint                           | P1-05        | done   | TK-008         |
| [TK-007](./tickets/TK-007-test-projects.md)          | Test projects                                       | P1-06        | done   | TK-008         |
| [TK-008](./tickets/TK-008-skeletons-and-versions.md) | Adapter and example skeletons, and the version plan | P1-07, P1-08 | done   | TK-003         |
| [TK-009](./tickets/TK-009-ci.md)                     | CI on the integration branch                        | P1-09        | done   | TK-005, TK-007 |

### Phase 2: main APIs

| Id                                                         | Title                        | Work package | Status  | Depends on |
| ---------------------------------------------------------- | ---------------------------- | ------------ | ------- | ---------- |
| [TK-010](./tickets/TK-010-paths.md)                        | Paths                        | P2-01        | done    | TK-007     |
| [TK-011](./tickets/TK-011-context.md)                      | Context                      | P2-02        | ready   | TK-010     |
| [TK-012](./tickets/TK-012-form-builder.md)                 | Form builder                 | P2-03        | blocked | TK-011     |
| [TK-013](./tickets/TK-013-extensions-and-field-members.md) | Extensions and field members | P2-04        | blocked | TK-012     |
| [TK-014](./tickets/TK-014-slots.md)                        | Slots                        | P2-05        | blocked | TK-013     |
| [TK-015](./tickets/TK-015-create-effect.md)                | createEffect                 | P2-06        | blocked | TK-012     |
| [TK-016](./tickets/TK-016-define-scope.md)                 | defineScope                  | P2-07        | blocked | TK-012     |
| [TK-017](./tickets/TK-017-adapter-entry.md)                | Adapter entry point          | P2-08        | blocked | TK-014     |
| [TK-018](./tickets/TK-018-depth-guard.md)                  | Depth guard, first form      | P2-09        | blocked | TK-014     |

### Phase 3: built-in extensions and slot groups

| Id                                         | Title                | Work package | Status  | Depends on                     |
| ------------------------------------------ | -------------------- | ------------ | ------- | ------------------------------ |
| [TK-019](./tickets/TK-019-values.md)       | Values extension     | P3-01        | blocked | TK-013                         |
| [TK-020](./tickets/TK-020-validation.md)   | Validation extension | P3-02        | blocked | TK-019                         |
| [TK-021](./tickets/TK-021-check.md)        | Check extension      | P3-03        | blocked | TK-020                         |
| [TK-022](./tickets/TK-022-status.md)       | Status extension     | P3-04        | blocked | TK-020                         |
| [TK-023](./tickets/TK-023-events.md)       | Events extension     | P3-05        | blocked | TK-022                         |
| [TK-024](./tickets/TK-024-arrays.md)       | Arrays extension     | P3-06        | blocked | TK-022, TK-021                 |
| [TK-025](./tickets/TK-025-reset.md)        | Reset extension      | P3-07        | blocked | TK-023                         |
| [TK-026](./tickets/TK-026-submit.md)       | Submit extension     | P3-08        | blocked | TK-022, TK-021                 |
| [TK-027](./tickets/TK-027-handles.md)      | Handles extension    | P3-09        | blocked | TK-023, TK-024, TK-025, TK-026 |
| [TK-028](./tickets/TK-028-slot-groups.md)  | Slot groups          | P3-10        | blocked | TK-025, TK-026, TK-021         |
| [TK-029](./tickets/TK-029-scope-checks.md) | Scopes on checks     | P3-11        | blocked | TK-027, TK-016                 |

### Phase 4: `standard` preset, integration tests and bundle checks

| Id                                                  | Title                 | Work package | Status  | Depends on     |
| --------------------------------------------------- | --------------------- | ------------ | ------- | -------------- |
| [TK-030](./tickets/TK-030-standard-preset.md)       | Standard preset       | P4-01        | blocked | TK-027, TK-028 |
| [TK-031](./tickets/TK-031-preset-flows.md)          | Preset flows          | P4-02        | blocked | TK-030         |
| [TK-032](./tickets/TK-032-cross-extension-flows.md) | Cross-extension flows | P4-03        | blocked | TK-029         |
| [TK-033](./tickets/TK-033-tiers-and-size-report.md) | Tiers and size report | P4-04        | blocked | TK-030, TK-005 |
| [TK-034](./tickets/TK-034-type-coverage.md)         | Type coverage         | P4-05        | blocked | TK-030, TK-018 |
| [TK-035](./tickets/TK-035-benchmark.md)             | Benchmark             | P4-06        | blocked | TK-030         |

### Phase 5: React adapter and the parity suite

| Id                                                   | Title                                | Work package | Status  | Depends on                     |
| ---------------------------------------------------- | ------------------------------------ | ------------ | ------- | ------------------------------ |
| [TK-036](./tickets/TK-036-parity-package.md)         | Parity package                       | P5-01        | blocked | TK-030                         |
| [TK-037](./tickets/TK-037-create-parts.md)           | React createParts                    | P5-02        | blocked | TK-036, TK-017                 |
| [TK-038](./tickets/TK-038-react-hooks.md)            | React hooks                          | P5-03        | blocked | TK-037                         |
| [TK-039](./tickets/TK-039-react-scopes.md)           | React scopes in parts                | P5-04        | blocked | TK-038                         |
| [TK-040](./tickets/TK-040-use-part.md)               | usePart                              | P5-05        | blocked | TK-037                         |
| [TK-041](./tickets/TK-041-react-server-lifecycle.md) | React server rendering and lifecycle | P5-06        | blocked | TK-037                         |
| [TK-042](./tickets/TK-042-react-types-package.md)    | React types, package and coverage    | P5-07        | blocked | TK-038, TK-039, TK-040, TK-041 |

### Phase 6: Solid 1 and Solid 2 adapters

| Id                                             | Title                     | Work package | Status  | Depends on     |
| ---------------------------------------------- | ------------------------- | ------------ | ------- | -------------- |
| [TK-043](./tickets/TK-043-solid-risk-probe.md) | Solid 1 risk probe        | P6-01        | blocked | TK-036, TK-037 |
| [TK-044](./tickets/TK-044-solid-v1-adapter.md) | Solid 1 adapter           | P6-02        | blocked | TK-043, TK-042 |
| [TK-045](./tickets/TK-045-solid-v2-adapter.md) | Solid 2 adapter           | P6-03        | blocked | TK-043, TK-042 |
| [TK-046](./tickets/TK-046-solid-package.md)    | The @oxform/solid package | P6-04        | blocked | TK-044, TK-045 |
| [TK-047](./tickets/TK-047-parity-closure.md)   | Parity closure            | P6-05        | blocked | TK-046         |

### Phase 7: example kit, example apps and comparison workspace

| Id                                                     | Title                          | Work package | Status  | Depends on             |
| ------------------------------------------------------ | ------------------------------ | ------------ | ------- | ---------------------- |
| [TK-048](./tickets/TK-048-kit-forms.md)                | Kit forms                      | P7-01        | blocked | TK-030                 |
| [TK-049](./tickets/TK-049-kit-extensions.md)           | Kit extensions                 | P7-02        | blocked | TK-048                 |
| [TK-050](./tickets/TK-050-kit-behaviors.md)            | Kit behaviors                  | P7-03        | blocked | TK-048, TK-049         |
| [TK-051](./tickets/TK-051-react-example.md)            | React example app              | P7-04        | blocked | TK-042, TK-050         |
| [TK-052](./tickets/TK-052-solid-example.md)            | Solid 1 example app            | P7-05        | blocked | TK-046, TK-051         |
| [TK-053](./tickets/TK-053-solid-v2-example.md)         | Solid 2 example app            | P7-06        | blocked | TK-046, TK-051         |
| [TK-054](./tickets/TK-054-comparison-specification.md) | Comparison form specifications | P7-07        | ready   | TK-008                 |
| [TK-055](./tickets/TK-055-comparison-research.md)      | Comparison research closure    | P7-08        | ready   | None                   |
| [TK-056](./tickets/TK-056-comparison-workspace.md)     | Comparison workspace           | P7-09        | blocked | TK-054, TK-042, TK-050 |
| [TK-057](./tickets/TK-057-comparison-measurement.md)   | Comparison measurement         | P7-10        | blocked | TK-056, TK-033         |

### Phase 8: documentation

| Id                                                  | Title                     | Work package | Status  | Depends on             |
| --------------------------------------------------- | ------------------------- | ------------ | ------- | ---------------------- |
| [TK-058](./tickets/TK-058-site-skeleton.md)         | Site skeleton             | P8-01        | ready   | TK-002                 |
| [TK-059](./tickets/TK-059-agent-outputs.md)         | Agent outputs             | P8-02        | blocked | TK-058                 |
| [TK-060](./tickets/TK-060-prose-pages.md)           | Prose with no code        | P8-03        | blocked | TK-059                 |
| [TK-061](./tickets/TK-061-main-api-pages.md)        | Main API pages            | P8-04        | blocked | TK-050, TK-059         |
| [TK-062](./tickets/TK-062-behavior-pages.md)        | Behavior and preset pages | P8-05        | blocked | TK-050, TK-059, TK-033 |
| [TK-063](./tickets/TK-063-compose-extend-guides.md) | Compose and extend guides | P8-06        | blocked | TK-050, TK-059, TK-033 |
| [TK-064](./tickets/TK-064-react-pages.md)           | React pages               | P8-07        | blocked | TK-051, TK-059, TK-033 |
| [TK-065](./tickets/TK-065-solid-pages.md)           | Solid pages               | P8-08        | blocked | TK-052, TK-053, TK-059 |
| [TK-066](./tickets/TK-066-migration-guide.md)       | Migration guide           | P8-09        | blocked | TK-042, TK-046, TK-059 |
| [TK-067](./tickets/TK-067-contributor-docs.md)      | Contributor documents     | P8-10        | blocked | TK-047, TK-059         |
| [TK-068](./tickets/TK-068-comparison-page.md)       | Comparison page           | P8-11        | blocked | TK-055, TK-057, TK-059 |

### Phase 9: release 0.7.0 and cleanup

| Id                                                      | Title                     | Work package | Status  | Depends on       |
| ------------------------------------------------------- | ------------------------- | ------------ | ------- | ---------------- |
| [TK-069](./tickets/TK-069-comparison-staleness-gate.md) | Comparison staleness gate | P9-06        | blocked | TK-057           |
| [TK-070](./tickets/TK-070-readiness-review.md)          | Readiness review          | P9-01        | blocked | TK-002 to TK-069 |
| [TK-071](./tickets/TK-071-delete-spikes.md)             | Delete the spikes         | P9-02        | blocked | TK-070           |
| [TK-072](./tickets/TK-072-version.md)                   | Version                   | P9-03        | blocked | TK-071           |
| [TK-073](./tickets/TK-073-merge-and-publish.md)         | Merge and publish         | P9-04        | blocked | TK-072, TK-069   |
| [TK-074](./tickets/TK-074-close-the-plan.md)            | Close the plan            | P9-05        | blocked | TK-073           |

<!-- tickets:end -->

## Coverage gaps

1. **Scripts that `check:all` and CI run before they exist.** `check:all` runs `check:terms` and
   `check:parity`, and CI runs `docs:check:agents` (`02#Tooling and scripts`, `02#CI`). TK-036 and TK-059 make
   them. The rule "a check that has no content yet is absent, not skipped" (`06#Approach to the rebuild`)
   applies: the ticket that makes a script adds it to `check:all` and CI.
2. **Drift from `main`.** The integration branch merges `main` after each 0.6.x fix (R13). This is a recurring
   task, and no ticket owns it.
