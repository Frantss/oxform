# Tickets: first iteration of the behavior API

Scope: Plan steps 2 to 5 of [proposal.md](../proposal.md). Build a throwaway spike, measure
bundle size, add a conformance test, and record the results. Plan step 6 is the migration.

| ID                                      | Outcome                                                      | Depends on                             |
| --------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| [TK-001](./tk-001-spike-scaffold.md)    | Spike package scaffold with type tests wired in              | None                                   |
| [TK-002](./tk-002-context-pipeline.md)  | Context and change pipeline                                  | TK-001                                 |
| [TK-003](./tk-003-create-values.md)     | `createValues` behavior                                      | TK-002                                 |
| [TK-004](./tk-004-validation-checks.md) | `createValidation` and `createCheck` with the `error` check  | TK-003                                 |
| [TK-005](./tk-005-define-configure.md)  | `defineForm`, `configureForm` and `extendForm` runtime       | TK-004                                 |
| [TK-006](./tk-006-warning-check.md)     | Second check (`warning`) proves registration and `exclusive` | TK-004                                 |
| [TK-007](./tk-007-lane-race-specs.md)   | Validation lane and race scenarios ported                    | TK-004, TK-006                         |
| [TK-008](./tk-008-extension-hooks.md)   | Hooks for extensions                                         | TK-003, TK-004                         |
| [TK-009](./tk-009-inert-api.md)         | Inert `api(ctx)` for server rendering                        | TK-005                                 |
| [TK-010](./tk-010-bundle-budget.md)     | Bundle budget in tiers                                       | TK-005, TK-006                         |
| [TK-011](./tk-011-kind-conformance.md)  | Conformance test for each kind that ships                    | TK-005                                 |
| [TK-012](./tk-012-spike-results.md)     | Spike results record                                         | TK-007, TK-008, TK-009, TK-010, TK-011 |

TK-005 and TK-006 can run in parallel after TK-004. TK-007, TK-008, TK-010 and TK-011 can run in
parallel after that.

## Coverage gaps

- **Bundle tier (c), the full preset.** It needs status, events, arrays, reset and submit. No
  spike ticket builds them. Recommended: measure tiers (a) and (b) now and defer (c). Open
  decision.
- **Submit hooks.** `submit.intercept` and `submit.onResult` have no owner. They arrive with
  `createSubmit` after the gate.
- **Open questions 5, 6, 7, 8 and 10** of the proposal are outside the spike. Question 8
  (performance) needs the memoized derived state, which the spike does not build.
- **Plan step 1** (review and cut the API) is a review by the user, not a ticket. A change to the
  API means TK-002 to TK-005 need review.
