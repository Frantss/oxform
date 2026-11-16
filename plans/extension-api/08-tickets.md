# Tickets

Status: draft, revision 1. This file agrees with [06-roadmap.md](./06-roadmap.md), revision 4. It owns the
ticket list and the map from each ticket to its work package. `06-roadmap.md` owns the scope, the order, the
verification and the exit criteria of each work package.

## Overview

- Each ticket completes one work package of `06-roadmap.md`, or two where the table says "merged".
- A ticket passes when the "Verification" cell of its work package and the exit criteria of its phase pass.
- "Source" names the work package, then the decisions (`D`), risks (`R`) and script gaps (`gap`) that the
  ticket applies or retires.
- Every work package, every decision row D01 to D54 and every script gap 1 to 12 has one ticket.
- A ticket that has a side effect (a tag, a branch, a version bump, a merge, a publish) needs the owner's
  approval when it runs (`AGENTS.md`, "Autonomy").
- A ticket branch is `codex/<work-package-id>-<short-name>` (D01).

## Tickets

### Phase 0: the reference and the integration branch

| Id     | Outcome                                                                                   | Source                 | Depends on                       |
| ------ | ----------------------------------------------------------------------------------------- | ---------------------- | -------------------------------- |
| TK-001 | The spike is tagged, its sizes are in `03`, and CI runs on a pull request into the branch | P0-03, P0-04, D01, R14 | None. Needs the owner's approval |

### Phase 1: workspace skeleton and packaging proof

| Id     | Outcome                                                                               | Source                                                             | Depends on     |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| TK-002 | The old sources, the old docs content and `postbuild` are deleted. Placeholders build | P1-01, D08                                                         | TK-001         |
| TK-003 | Core publishes four ESM entries from placeholders. `publint` and `attw` pass          | P1-02, D02, D03                                                    | TK-002         |
| TK-004 | One internal channel is shared by all entries, and no module is in two chunks         | P1-03, D05, R01, gap 6                                             | TK-003         |
| TK-005 | The tree-shaking check fails for a forbidden marker. The size report prints the tiers | P1-04, R02, gap 11                                                 | TK-003         |
| TK-006 | A wrong import in each area fails `check:rules`                                       | P1-05, D10, R03                                                    | TK-003         |
| TK-007 | The unit, integration, coverage and type-test projects run. A missing spec fails      | P1-06, D07, D11, R05, R06, gaps 1 and 2                            | TK-003         |
| TK-008 | The adapter and example skeletons build. Changesets plans 0.7.0 three times           | P1-07 and P1-08 (merged: both are manifests), D04, D06, R04, gap 5 | TK-003         |
| TK-009 | CI on the integration branch fails a pull request with a forbidden marker in a tier   | P1-09, gap 3                                                       | TK-005, TK-007 |

### Phase 2: main APIs

| Id     | Outcome                                                                             | Source                         | Depends on |
| ------ | ----------------------------------------------------------------------------------- | ------------------------------ | ---------- |
| TK-010 | Path helpers and path types replace `remeda` and `type-fest`                        | P2-01, D09, R12                | TK-007     |
| TK-011 | The context: state slices, cleanups, the validation link and its stand-in           | P2-02, D16, D53                | TK-010     |
| TK-012 | The form builder, with the runtime error for a missing need at `create`             | P2-03, D14, D15, D18, D51, D52 | TK-011     |
| TK-013 | `defineExtension`, `on` and field members, with the `needs` type lock               | P2-04, D51                     | TK-012     |
| TK-014 | `defineSlots` and `slots` with their needs checks. `ElementTag` rejects a wrong tag | P2-05, D13, D51                | TK-013     |
| TK-015 | `createEffect`                                                                      | P2-06                          | TK-012     |
| TK-016 | `defineScope` defaults and conflict rules 1, 2, 5 and 6                             | P2-07                          | TK-012     |
| TK-017 | The `@oxform/core/adapter` entry point                                              | P2-08, D17                     | TK-014     |
| TK-018 | The first depth-guard form compiles                                                 | P2-09, R08                     | TK-014     |

### Phase 3: built-in extensions and slot groups

TK-023, TK-024 and TK-026 can run in parallel after TK-022.

| Id     | Outcome                                                   | Source                    | Depends on       |
| ------ | --------------------------------------------------------- | ------------------------- | ---------------- |
| TK-019 | `values`                                                  | P3-01, D19                | TK-013           |
| TK-020 | `validation`, with stale runs and `onRun`                 | P3-02, D23, D24, D53      | TK-019           |
| TK-021 | `check`, with typed check names and root issues           | P3-03, D21, D22           | TK-020           |
| TK-022 | `status`, with and without `validation`                   | P3-04                     | TK-020           |
| TK-023 | `events`                                                  | P3-05                     | TK-022           |
| TK-024 | `arrays`                                                  | P3-06                     | TK-022, TK-021   |
| TK-025 | `reset`                                                   | P3-07                     | TK-023           |
| TK-026 | `submit`, with and without `validation`                   | P3-08                     | TK-022           |
| TK-027 | `handles`, `form.scope` and `prefixOf`                    | P3-09, D25                | TK-023 to TK-026 |
| TK-028 | The five slot groups, with hard needs, work on lean forms | P3-10, D20, D26, D49, D54 | TK-025, TK-026   |
| TK-029 | Scope validators and conflict rules 3 and 4               | P3-11                     | TK-027, TK-016   |

### Phase 4: `standard` preset, integration tests and bundle checks

| Id     | Outcome                                                                 | Source            | Depends on     |
| ------ | ----------------------------------------------------------------------- | ----------------- | -------------- |
| TK-030 | The `standard` preset, with the "public exports only" specs             | P4-01             | TK-027, TK-028 |
| TK-031 | I1 runs from `dist`, and I9 shows that a lean chain equals the preset   | P4-02, R16        | TK-030         |
| TK-032 | Integration scenarios I2, I3, I4 and I6                                 | P4-03             | TK-029         |
| TK-033 | Every tier runs on `dist`, and the first size report is in `reports/`   | P4-04             | TK-030, TK-005 |
| TK-034 | Every export has type cases, and the depth guard passes with `standard` | P4-05, R08, gap 1 | TK-030, TK-018 |
| TK-035 | The benchmark numbers are in `reports/`                                 | P4-06, gap 9      | TK-030         |

### Phase 5: React adapter and the parity suite

| Id     | Outcome                                                                      | Source                 | Depends on       |
| ------ | ---------------------------------------------------------------------------- | ---------------------- | ---------------- |
| TK-036 | The parity package: fixtures, P1 to P14, the driver contract, `check:parity` | P5-01, gap 7           | TK-030           |
| TK-037 | React `createParts`: P1, P2, P4, P8 and P9 pass                              | P5-02, D30, D34, D49   | TK-036, TK-017   |
| TK-038 | React hooks: P3 and P7 pass                                                  | P5-03, D31             | TK-037           |
| TK-039 | React scopes in parts: P6 passes                                             | P5-04                  | TK-038           |
| TK-040 | `usePart`: P5 passes                                                         | P5-05, D32             | TK-037           |
| TK-041 | React server rendering and lifecycle: P10 to P14 pass                        | P5-06 (I5)             | TK-037           |
| TK-042 | React types, package and coverage checks pass. `dist` holds no copy of core  | P5-07, D29, D35, gap 4 | TK-038 to TK-041 |

### Phase 6: Solid 1 and Solid 2 adapters

| Id     | Outcome                                                                | Source            | Depends on     |
| ------ | ---------------------------------------------------------------------- | ----------------- | -------------- |
| TK-043 | The Solid 1 risk probe: P1 and P8 pass                                 | P6-01, D34, R10   | TK-036         |
| TK-044 | The Solid 1 adapter: P1 to P14 pass                                    | P6-02, D33        | TK-043, TK-042 |
| TK-045 | The Solid 2 adapter: P1 to P14 pass                                    | P6-03, D33        | TK-043, TK-042 |
| TK-046 | `@oxform/solid` assembles `.` and `./v2`. The consumer check passes    | P6-04, D35        | TK-044, TK-045 |
| TK-047 | Parity closure: the same names in the three adapters, one P10 snapshot | P6-05, R17, gap 7 | TK-046         |

### Phase 7: example kit, example apps and comparison workspace

| Id     | Outcome                                                                            | Source          | Depends on             |
| ------ | ---------------------------------------------------------------------------------- | --------------- | ---------------------- |
| TK-048 | Kit forms E01 to E05                                                               | P7-01, D36, D37 | TK-030                 |
| TK-049 | Kit extensions E06 to E14                                                          | P7-02           | TK-048                 |
| TK-050 | Kit behaviors E15 to E28                                                           | P7-03           | TK-048                 |
| TK-051 | The React example app: E29 to E33 and the I8 flows                                 | P7-04           | TK-042, TK-050         |
| TK-052 | The Solid 1 example app                                                            | P7-05           | TK-046, TK-051         |
| TK-053 | The Solid 2 example app                                                            | P7-06           | TK-046, TK-051         |
| TK-054 | The comparison specification, shared schema and shared test, which fails on a stub | P7-07, D50      | TK-008                 |
| TK-055 | Comparison research: no "Unverified" cell, and `features.json` is written          | P7-08           | None                   |
| TK-056 | The comparison workspace: every version passes the shared test                     | P7-09           | TK-054, TK-042, TK-050 |
| TK-057 | Comparison measurement: `compare:size`, `compare:check`, `results/size.json`       | P7-10           | TK-056, TK-033         |

### Phase 8: documentation

If the review of TK-061 to TK-064 is too large, split the ticket by folder (`06#Deviations and decisions` 8).

| Id     | Outcome                                                                           | Source                      | Depends on             |
| ------ | --------------------------------------------------------------------------------- | --------------------------- | ---------------------- |
| TK-058 | The site skeleton and the redirects                                               | P8-01, D38                  | TK-002                 |
| TK-059 | The agent outputs, `docs:check:agents`, the docs tool checks and `check:terms`    | P8-02, R07, gap 10          | TK-058                 |
| TK-060 | The prose pages with no code, and the `docs/architecture.md` draft                | P8-03, D42                  | TK-058                 |
| TK-061 | The main API pages                                                                | P8-04, D45                  | TK-050, TK-059         |
| TK-062 | The behavior and preset pages                                                     | P8-05                       | TK-050, TK-059         |
| TK-063 | The compose and extend guides                                                     | P8-06                       | TK-050, TK-059         |
| TK-064 | The React pages and the playground, checked at desktop and mobile sizes           | P8-07, D39                  | TK-051                 |
| TK-065 | The Solid pages                                                                   | P8-08                       | TK-052, TK-053         |
| TK-066 | The migration guide has no `†` row, and the trial is in `reports/`                | P8-09, D43, D44, R15, gap 8 | TK-042, TK-046         |
| TK-067 | The contributor documents and readmes. The two 0.x behavior documents are deleted | P8-10, D40, D41, D48        | TK-047, TK-059         |
| TK-068 | The comparison page with the generated tables                                     | P8-11                       | TK-055, TK-057, TK-059 |

### Phase 9: release 0.7.0 and cleanup

| Id     | Outcome                                                                         | Source             | Depends on                                 |
| ------ | ------------------------------------------------------------------------------- | ------------------ | ------------------------------------------ |
| TK-069 | `prepublish` fails with stale comparison data                                   | P9-06, R09, gap 12 | TK-057                                     |
| TK-070 | The readiness review: each item of the definition of done has evidence          | P9-01              | TK-002 to TK-068                           |
| TK-071 | `explorations/` is deleted, and the build passes without it                     | P9-02              | TK-070                                     |
| TK-072 | The three manifests and changelogs show 0.7.0                                   | P9-03, D46         | TK-071. Needs the owner's approval         |
| TK-073 | The integration branch is merged into `main`, and the packages are published    | P9-04, R13         | TK-072, TK-069. Needs the owner's approval |
| TK-074 | `plans/extension-api/` is removed. Stage B and the follow-ups are in `reports/` | P9-05, D40         | TK-073                                     |

## Coverage gaps

1. **Kit extensions in the app and the guides.** P7-04 ("one browser flow per example") and P8-06 (the extend
   guides) can render or cite E06 to E14, but neither depends on P7-02. If they do, add TK-049 to TK-051 and
   TK-063.
2. **Scripts that `check:all` and CI run before they exist.** `check:all` runs `check:terms` and
   `check:parity`, and CI runs `docs:check:agents` (`02#Tooling and scripts`, `02#CI`). TK-036 and TK-059 make
   them. The rule "a check that has no content yet is absent, not skipped" (`06#Approach to the rebuild`)
   applies: the ticket that makes a script adds it to `check:all` and CI.
3. **Drift from `main`.** The integration branch merges `main` after each 0.6.x fix (R13). This is a recurring
   task, and no ticket owns it.
