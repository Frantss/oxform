---
id: TK-070
title: Readiness review
phase: 9
work_package: P9-01
status: in-progress
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
started: 2026-11-18
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
- [x] Each decision of the register has evidence in the ticket of its "Applied in" work package.
- [x] `pnpm run build`, `pnpm run check:all`, `pnpm run test` and `pnpm run docs:check:agents` pass on the
      integration branch.
- [x] `pnpm run check:format` passes.

## Evidence

Run 1, 2026-11-18, on `codex/P9-01-readiness-review` at `05d23de` (the integration head). Result: 5 pass, 3
accepted deviations, 4 with a closing ticket, 2 failed. The status stays `in-progress` until the failed items are
fixed and this review runs again.

### Commands

- `pnpm install`: exit 0. `pnpm run build`: exit 0, 13/13 tasks.
- `pnpm run check:all`: exit 0 (lint, format, types, `check:terms`, `check:package` with `publint --strict`, `attw
  --profile esm-only`, `check:types:dist` and `check:type-coverage` of the three packages, and `check:parity`:
  "@oxform/react, @oxform/solid, @oxform/solid/v2 export the same names").
- `pnpm run test`: exit 0. Core 404, adapter-parity 5, React 24 + 3 server, Solid 1 29 + 3 server, Solid 2 60 + 3
  server, kit 66, React example 21, Solid 1 example 19 + 2, Solid 2 example 38 + 2.
- `pnpm run docs:build`: exit 0. `pnpm run docs:check:agents`: "72 pages and 7 templates pass".
  `pnpm run check:format`: "All matched files use the correct format" (805 files).
- `pnpm run test:coverage` (core, information only): statements 98.71%, branches 97.02%, functions 99.42%, lines
  99.4%. No threshold is set.
- Production server (`PORT=3210 pnpm run docs:start`, stopped after): `/docs/core` 200 (the Main APIs page),
  `/docs/react` and `/docs/solid` 307 to `/docs`. `/docs/comparison`, `/docs/limits` and `/docs` at 1280x800 and
  390x844: no horizontal page scroll, no console error, page error or hydration warning.

### Definition of done

1. Build, `check:all`, test, `docs:check:agents` on `main`: **closer TK-073**. All four pass on the integration
   branch (Commands above).
2. Core coverage 100 per file, adapter coverage of `03#Coverage`: **deviation**, owner decision of 2026-11-16
   ("only test behavior", TK-033 and TK-028 Evidence, commit `7ae20db`). No threshold exists. Core is 98.71%.
3. Every export in `01`, with a positive and a negative type case and a reference page: **pass**.
   `check:type-coverage` passes for core, React, Solid 1 and Solid 2 (inventory from `01`). `docs:check:agents`
   passes the inventory rule of `04#3` (each runtime export of `core/`, `behaviors/`, `presets/` has a page). Type
   exports: `core/types`. `@oxform/core/adapter` is in `docs/adapter-authors.md` (`04#9`: "No public page holds
   it"). Note: 26 api types of `@oxform/core/behaviors` (for example `ValuesApi`, `SubmitResult`) are named on no
   page. `04#3` asks only for functions and values (finding in `reports/extension-api-rebuild.md`).
4. `check:tree-shaking` for each tier, published sizes: **deviation**, owner decision of 2026-11-16 (TK-033
   dropped, scripts deleted in `7ae20db`) and owner decision 19. No page or readme states a measured size or a
   benchmark number (grep of `apps/docs/content`, the readmes, `docs/`). `reports/behavior-api-spike.md` keeps
   the spike numbers as history. One stale sentence: `reports/extension-api-rebuild.md:157` says that "the size
   table measures it" (finding).
5. Comparison page as a static table: **FAIL**. Pass: `comparison.mdx` (TK-068), all 84 records of
   `07-comparison-features.json` render with their value and source in `dist/client/docs/comparison.md`, and
   `/comparison.json` equals the JSON. Failed:
   - At 390x844 the matrix breaks words inside the word ("Not avail able", "Bui lt-in"): the cells have
     `overflow-wrap: anywhere`, and the cell width is 58 px. Owner: TK-068.
   - The table depends on `plans/extension-api/`, which TK-074 removes: `apps/docs/scripts/generate-comparison.ts:21`
     reads the JSON there (`docs:build` then fails), each Oxform cell links to a plan file on GitHub `main`,
     `comparison.mdx:54` and `.github/ISSUE_TEMPLATE/comparison-correction.yml:9` name the plan path. Owner:
     TK-068, before TK-074.
   - Not a failure yet: the "(planned)" suffix must go at release (`07#3.1`, "Rules"), and no ticket owns that step.
     Proposed closer: TK-073.
6. `publint`, `attw` ESM only, the module-sharing spec, the consumer checks: `publint` and `attw` **pass**
   (`check:package` in `check:all`). The module-sharing spec and the consumer checks: **deviation**, owner decision
   of 2026-11-16 (deleted in `7ae20db`). TK-073 keeps a consumer install by hand in its acceptance.
7. React, Solid 1 and Solid 2 pass P1 to P14, differences in `01#6.3`: **pass**. TK-047 Evidence (P1 to P15, the
   `01#6.3` rows of phase 6), `pnpm run test` and `check:parity` above.
8. E01 to E33 in the kit with a test, example apps pass: **pass**. E01 to E28 are in `examples/kit/src` (27 spec
   files, 66 tests). E29 to E33 are rendering rows, so they are in `examples/{react,solid,solid-v2}/src/examples`
   (D37). Each example app passes its tests.
9. Every snippet type-checked, agent trial of `04#7.5` in `reports/`: **FAIL**.
   - Snippets: `docs:build` passes. 137 blocks carry `no-check`. 128 are `<include>`s of kit or example-app files,
     which `check:types` of those workspaces compiles in `check:all` (`04#8`, "Include, do not copy"). The Solid 1
     includes use `no-check` because the docs app resolves the Solid 2 types of `@oxform/solid`'s dev dependency
     (`reports/extension-api-rebuild.md`); `examples/solid` compiles them against Solid 1, so this is an
     accepted deviation under `04#8` rule 4, not a failure. 8 inline step blocks with `no-check="imports files of
     the example kit"` (for example `extend/replace-a-slot.mdx:56`, `compose/slot-group.mdx:59`) were compiled by
     hand once (TK-063 Evidence) and no check compiles them now (finding).
   - Failed: the agent trial of `04#7.5` (only `llms.txt`, "write the sign-in form as a lean chain, then add a
     `warning` check", type-check the output) is in no report and no ticket. `reports/migration-trial.md` is the
     trial of the migration guide (TK-066), which TK-066 states is a different trial. Owner: P8-02 (TK-059).
   - Failed: `examples/kit/src/masks.ts:28` says `string` keys are needed because `Path<Values>` does not index a
     mapped option. That no longer holds (TK-063 finding), and `extend/field-members.mdx:97` includes the file,
     so the page shows a false fact. Owner: the kit (TK-050).
10. Migration guide with no `†` row: **pass**. 0 in `05-migration-guide.md` and `migration/index.mdx` (TK-066).
11. `docs/*.md`, `AGENTS.md`, readmes describe the new structure: **closer TK-073** for hosting, else pass. TK-067
    Evidence. Each `docs/*.md` link of `AGENTS.md` resolves, each `pnpm run` script of `docs/commands.md` exists,
    `form-core-behaviors.md` and `checks-and-issues.md` are deleted. The readmes link
    `https://oxform.frantss.uy` and its `llms.txt` (`readme.md:66`, `packages/*/readme.md`); the owner has not
    confirmed the domain, and the hosting moves on `main`. `vite.config.ts` still names `explorations/`
    (TK-071).
12. Each decision applied, each accepted limit on `limits.mdx`: **pass**. Decisions: the list below. Limits: the
    20 rows of `04#5.2` are on `limits.mdx`, the row "a duplicate option name throws at `.extend`" as the
    source behavior (a type error only, owner 2026-11-16, TK-060 Evidence). The frictions of `04#5.2` that stay
    (named-extension casts, `null` state) are there, `usePart` props are fixed (D32), `change.path` needs no cast
    now (TK-063). TK-021 and TK-027 accepted no limit (D21, D25). Extra rows: generic preset casts, `dirty`,
    reset baseline, `text` after `state`, partial scope default (TS2739).
13. `explorations/` deleted, last building commit tagged: **closer TK-071**. Tag `spike/extension-api` is on
    `7f1b012` (TK-001 Evidence).
14. Packages published at 0.7.0, ESM only: **closer TK-073** (version: TK-072).

### Decision register

Evidence is the Evidence section of the ticket of the "Applied in" work package, checked against the source of
this branch.

- D01 (P0-04, TK-001): `codex/extension-api-rebuild` exists, ticket branches are `codex/<id>-<name>`. The merge
  into `main` is TK-073.
- D02 (P1-02, TK-003): four entries, `packages/core/export/adapter.ts`, `./adapter` in `exports`.
- D03 (P1-02, TK-003): `export/behaviors.ts` exports the 9 extensions, 5 slot groups and api types, no `create*`.
- D04 (P1-08, TK-008): `fixed` group and one `minor` changeset; `changeset status` gives 0.7.0 for the three.
- D05 (P1-03, TK-004): bundled entries with shared chunks. The spec was deleted later (owner, 2026-11-16).
- D06 (P1-07, TK-008): `packages/solid-v1`, `solid-v2`, `solid`.
- D07 (P1-06, TK-007): `src/**/*.spec.ts`, `tests/*.spec.ts`, `tests/types/*.test-d.ts` in `vite.config.ts`.
- D08 (P1-01, TK-002): no `postbuild` in the root `package.json`.
- D09 (P2-01, TK-010): no `remeda` or `type-fest` in any manifest.
- D10 (P1-05, TK-006): lint overrides, `allowTypeImports` works.
- D11 (P1-06, TK-007): `check:types` runs `tsc --noEmit -p tests/types` in each package.
- D12 (Applied): the rename table of `01#7.1` is in the plan files and the source (`within`, option kinds and
  `createX` are absent).
- D13 (P2-05, TK-014): `packages/core/src/main/types.ts:230` `ElementTag = keyof HTMLElementTagNameMap`.
- D14 (P2-03, TK-012): replaced by D34; `OptionTypes` is exported, `ResolveSelf` and `FormTypes` are not.
- D15 (P2-03, TK-012): `packages/core/src/main/form.ts:173` `form-${++instanceCount}`.
- D16 (P2-02, TK-011): cleanup at each unmount and at `destroy()`, TK-011 and TK-041 Evidence.
- D17 (P2-08, TK-017): `adapterControlsOf` only in `@oxform/core/adapter`.
- D18 (P2-03, TK-012): the spike order stays, TK-012 Evidence and `reports/extension-api-rebuild.md`.
- D19 (phase 3, TK-019 to TK-027): no `create*` export in any entry.
- D20 (P3-10, TK-028): the five groups work on a lean chain, TK-028 and TK-048 Evidence.
- D21 (P3-03, TK-021): check names typed from `CheckNamesOf`, no limit needed.
- D22 (P3-03, TK-021): root issues at `''`.
- D23 (P3-02, TK-020): a discarded run resolves an empty list per check.
- D24 (each module): the `01#9` rows in TK-019 to TK-028 Evidence.
- D25 (P3-09, TK-027): invariant phantom member, no limit needed.
- D26 (P3-10, TK-028): slot-group needs are type errors at the spread and throw at `create`.
- D29 (P5-07, TK-042): applied, then no longer applies. The owner decision of 2026-11-16 removed every coverage
  threshold (`7ae20db`). No adapter has `test:coverage`.
- D30 (P5-02, TK-037): no `within` in the adapter sources; parts take `scope`.
- D31 (P5-03, TK-038): no `useFormEffect`; one pattern per adapter page.
- D32 (P5-05, TK-040): `usePart` takes the part props without the slot props.
- D33 (phase 6, TK-044, TK-045): Solid hooks keep the `use*` names; `check:parity` passes.
- D34 (P5-02, P6-01: TK-037, TK-043): options are a type only (`optionTypes`), `Root` takes `options`.
- D35 (P5-07, P6-04: TK-042, TK-046): React peers `@oxform/core` and `react ^19.0.0`; Solid peer
  `^1.9.0 || 2.0.0-rc.19`.
- D36 (P7-01, TK-048): E01 to E33 exist (DoD item 8).
- D37 (P7-01, TK-048): rendering in the example apps (E29 to E33), the rest in the kit.
- D38 (P8-01, TK-058): `core/`, `behaviors/`, `presets/`, `compose/`, `extend/`, `adapters/` folders.
- D39 (P8-07, TK-064): `quick-start.mdx` writes the lean chain first, "Swap the chain for standard" last.
- D40 (P8-10, P9-05: TK-067, TK-074): stage A links in the package readmes; stage B is TK-074.
- D41 (P8-10, TK-067): both 0.x behavior documents are deleted.
- D42 (P8-03, TK-060): `docs/architecture.md` exists.
- D43 (P8-09, TK-066): no codemod.
- D44 (P8-09, TK-066): the three answers in `migration/index.mdx`.
- D45 (P8-04, TK-061): no `AnyInstance` export; the patterns are on `core/types`.
- D46 (phase 9): closer TK-072 and TK-073 (no prerelease).
- D47 (Nothing): no MCP server, skill, per-section index or versioned site (`apps/docs/src/routes`).
- D48 (P8-10, TK-067): `readme.md:4` is one deprecation line.
- D49 (P3-10, P5-02: TK-028, TK-037): no root group without `submit`; `limits.mdx#no-root-element`.
- D50 (P7-07): no longer applies, owner decision 19 (TK-054, TK-056, TK-057 dropped).
- D51 (P2-03 to P2-05, P3-10: TK-012, TK-013, TK-014, TK-028): every need required, inline `needs` optional
  (owner, 2026-11-16).
- D52 (P2-03, TK-012): `packages/core/src/main/form.ts:55` throws at `create` before any `api` runs.
- D53 (P2-02, P3-02: TK-011, TK-020): `noValidation` stand-in, `packages/core/src/main/context.ts:42`.
- D54 (P3-10, TK-028): five groups, one per part.

### Plan contradictions

- TK-073 expects `/docs/core` to redirect to the introduction. TK-058 made it serve `core/index.mdx` once that page
  exists, and the shared brief accepts it. Recommendation: change the TK-073 acceptance to "`/docs/react` and
  `/docs/solid` redirect to the introduction, and `/docs/core` serves the Main APIs page".
- The definition of done and `00#Owner decisions` still list the coverage gate, the tree-shaking check, the size
  report, the module-sharing spec and the consumer checks. The owner decision of 2026-11-16 that removed them is
  only in TK-028, TK-033 and TK-035 Evidence. Recommendation: record it as owner decision 20 in `00-direction.md`
  and mark the four items in the definition of done, before TK-074 moves the follow-ups to `reports/`.
