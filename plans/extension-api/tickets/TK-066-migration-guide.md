---
id: TK-066
title: Migration guide
phase: 8
work_package: P8-09
status: in-progress
depends_on: [TK-042, TK-046, TK-059]
branch: codex/P8-09-migration-guide
pr: null
started: 2026-11-18
completed: null
---

# TK-066: Migration guide

## Outcome

Each fact of the migration guide is checked on the built packages, and the guide has no `†` row. The guide is
published at `migration/index`. A trial by hand of the guide is recorded in `reports/`.

## Scope

- In: check each `†` row of `05-migration-guide.md` Part B and each of the 11 verification items of Part A on
  the built packages. Correct the text where a fact differs, then remove the mark. Publish Part B as
  `migration/index.mdx`, with the "after" example type-checked. Apply a coding agent to a 0.x application with
  the guide only, and record the result in `reports/`.
- Out: a codemod or a compatibility layer (D43). The agent trial of `04-documentation.md#7.5`, which is a
  different trial. Other pages (TK-060 to TK-065).

## Read first

- `05-migration-guide.md#Part A: about this guide`: the scope and the 11 verification items.
- `05-migration-guide.md#Part B: migrate from Oxform 0.x to 0.7.0 (the extension API)`: the guide.
- `05-migration-guide.md#Deviations and decisions`: the answers for 0.x features with no replacement.
- `04-documentation.md#10`: step 5.
- `02-structure.md#Tooling and scripts`: the migration guide has no script.

## Decisions to apply

- D43: ship no codemod. The agent-focused guide replaces it.
- D44: for the form outside `Root`, move the code inside `Root`, else use `<Root form={instance}>`. For custom
  levels on the preset, use `instance.<name>.at(path)` and `useSelector`, or the nine extensions with the check
  before `handles`. List the removed type helpers in one row, with the read-back types.

## Acceptance

- [x] `05-migration-guide.md` has no `†`.
- [x] Each of the 11 items of Part A has a recorded result on the built packages.
- [x] The "after" example compiles in `pnpm run docs:build`.
- [ ] The trial is recorded in `reports/`: the application, the agent, the result of section 6 "Verify".
- [x] `pnpm run docs:check:agents` and `pnpm run check:format` pass.
- [x] `migration/index` renders at desktop and mobile sizes. The console shows no runtime, SSR or hydration
      error (`AGENTS.md`, "Validation").

## Evidence

Record the result of each verification item, the command results and any deviation from the plan here.

### Part 1: facts on the built packages (2026-11-18)

Base: `codex/extension-api-rebuild` at `c72390c`, after `pnpm install` and `pnpm run build` (12 of 12 tasks). The
probes ran from temporary directories in `examples/react`, `examples/solid` and `examples/solid-v2` with no alias,
so `@oxform/*` resolved to `packages/*/dist` (`require.resolve` gave `packages/core/dist/index.js` and
`packages/react/dist/index.js`). They were deleted after the run.

- Type probe: `tsc --noEmit` (TypeScript 7.0.2) on a file that uses each mapping row, the types paragraph and the
  React rows, with `@ts-expect-error` for `defaultStatus: { touched }`, `reset.at(path, { status })`,
  `field.warning()` after `standard` and `<Root form options>`. Exit 0. The Solid 1 and Solid 2 probes also
  compile.
- The "after" example, cut from the guide with one `declare const invite`: exit 0 after the corrections. Before
  them: `TS2322` (`onSubmit` on `Root` is `SubmitEventHandler<HTMLFormElement>`) and `TS7006` on `message`.
- Runtime: a Node script on the core dist, and Vitest browser tests in Chromium: React 7 of 7, the "after"
  example 1 of 1, Solid 1 of 1, Solid 2 of 1 passed.

| Former `†` row                               | Verified fact                                                                                                                                                                                                                                                            | Evidence                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1. `pnpm add ... @oxform/solid@0.7.0`        | `@oxform/solid` has `.` and `./v2`, ESM only, `@oxform/core` as a peer. `changeset status` plans 0.7.0 for core, react and solid.                                                                                                                                        | `packages/solid/package.json`; `pnpm exec changeset status --verbose`                                   |
| 1. Import table, `@oxform/solid`, `/v2`      | Both export `createParts` and `usePart`.                                                                                                                                                                                                                                 | `packages/solid/dist/index.js`, `dist/v2/index.js`; Solid probes                                        |
| 3. `createForm(options)`                     | `form.create()` with no `id` gives `form-1`, then `form-2`. Text: adds "(`form-1`)".                                                                                                                                                                                     | Node: `["form-1","form-2"]`                                                                             |
| 3. `field.setIssues({ error })`              | `field.setError(entries)` and `instance.error.set(name, entries)` type-check and write `error[name]`.                                                                                                                                                                    | Type probe; Node item 9                                                                                 |
| 3. `form.issues()`, root                     | `validation.issues()`, `error.at('')`, `error.set('', entries)` and `state.error['']` hold the root entries.                                                                                                                                                             | Node: `{"error":[{"message":"Server down"}]}`; React `useSelector(state => state.error[''])` renders it |
| 3. React `useFormEffect`                     | `useEffect(() => createEffect(useForm(), selector, fn).unsubscribe, [instance])` runs on change, not after unmount. Text: "return its `unsubscribe`".                                                                                                                    | React probe: calls `["ab"]`, none after unmount                                                         |
| 3. Solid 0.x paragraph                       | Same members as React (10). `useSelector` returns an accessor. `useField(() => 'email')` follows the path. Text: names each 0.x row and the Solid differences.                                                                                                           | Solid 1 and 2 probes                                                                                    |
| 4. `Root` prevents `submit` and `reset`      | `defaultPrevented` is true for both. A native `type='reset'` button leaves the value and the DOM value (`"keep"`). `Reset` restores the defaults. No reload.                                                                                                             | React probe item 10                                                                                     |
| 4. `validation.run`, discarded run           | `[true,{"error":[],"warning":[]}]`; the newer run `[false,{ error: [entry with type "change"] }]`.                                                                                                                                                                       | Node item 5                                                                                             |
| 4. Ids                                       | `form-1-email`, `form-1-address-city`, `invite-email` with `create({ id: 'invite' })`. Under `Root`: `_r_5_` and `_r_5_-email`, Solid `cl-0-email`. Text: dot as `-`.                                                                                                    | Node item 8; React and Solid probes                                                                     |
| 4. `useField` and check entries              | Renders: 1, then 2 after the first entry (the `valid` flag changed), 2 after a second entry, 2 after another field, 3 after its own value. Text: names the flag.                                                                                                         | React probe item 6                                                                                      |
| 4. `<Field>` by `type`                       | `"5"` writes `5`, empty writes `undefined`, a checkbox `true`, a text input `"7"`. `File` and list: the built `valueOfInput`.                                                                                                                                            | React probe item 7; `packages/core/dist/behaviors-*.js` `valueOfInput`                                  |
| 4. `setError` against `error.set`            | `setError`: gone after a change of the field, kept after a change of another field. `error.set`: kept with no validator, and with a submit validator after a change; removed by a submit run, by a change with a change validator, and by `reset.all()`. Text corrected. | Node item 9                                                                                             |
| 4. Non-exclusive check                       | Hand entries (no type, and `type: 'blur'`) stay after a blur, a change run, a blur run and a full run, and go at `warning.clear`. Change entries refresh on change.                                                                                                      | Node item 11                                                                                            |
| 6. "Do not" bullet on `†` rows in Solid code | Removed: every Solid row is verified.                                                                                                                                                                                                                                    | Solid probes                                                                                            |

| Part A item | Result                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1           | Holds. Solid 1 and Solid 2 render `form`, `input`, `p`, `button`; submit with `options.onSubmit`; empty number writes `undefined`.     |
| 2           | Holds. Four core entries; `standard` from `/presets`; `check` and the slot groups from `/behaviors`; no `formOptions` or `createForm`. |
| 3           | Holds in React (server HTML `<form><input .../><button type="submit">...<button type="reset">...`), Solid 1 and Solid 2.               |
| 4           | Holds (React effect pattern; `''` path in core and with `useSelector`).                                                                |
| 5           | Holds.                                                                                                                                 |
| 6           | Holds, with the `valid` flag detail.                                                                                                   |
| 7           | Holds.                                                                                                                                 |
| 8           | Holds.                                                                                                                                 |
| 9           | Holds for `setError`; the "stay" of `error.set` is narrower (exclusive `error` check). Guide corrected.                                |
| 10          | Holds.                                                                                                                                 |
| 11          | Holds.                                                                                                                                 |

Deviations: facts outside the `†` rows that differed and were corrected in the guide: `Root` takes the options in
its `options` prop (sections 3, 4, 5 and the example), and the `FieldError` state is `any` in the built types (the
example types `message`; finding in `reports/extension-api-rebuild.md`). The `usePart` note of "Deviations and
decisions" now follows the built type. Not in part 1: `migration/index.mdx`, `docs:build`, `docs:check:agents`,
the browser check of the page and the agent trial.

### Part 2: the published page (2026-11-18)

Base: integration `7696c2c` (with `eccecd1`, which types the `fieldError` state `{ messages: string[] }`), after
`pnpm install` and `pnpm run build` (12 of 12).

- Page: `apps/docs/content/docs/migration/index.mdx`, made from Part B section by section, already listed in
  `migration/meta.json` (`"pages": ["index"]`). Headings: `In short`, sections 1 to 7 with the ids `packages`,
  `detect`, `mapping`, `behavior-changes`, `procedure`, `verify`, `no-replacement`, then `Related`. Recorded in
  `apps/docs/scripts/heading-ids.json`.
- Guide changes, kept the same on the page: the `(message: string)` annotation is removed; the "after" example
  declares `invite`, so it compiles alone with no hidden code; a new section 7, "0.x features with no
  replacement", gives the reader-facing answers of "Deviations and decisions" (items 1 to 8, D44 included: the
  removed type helpers in one item), and sections 3 and 6 point to it.
- Twoslash: `pnpm run docs:build` passes with the "after" block marked `twoslash` and no annotation. Negative
  control: `{message.toFixed()}` in the same block failed the build with
  `[2551] Property 'toFixed' does not exist on type 'string'`, so the block is checked and `message` is a
  `string` on the rebuilt packages. The control was reverted.
- `pnpm run docs:check:agents`: "2 pages and 7 templates pass". `pnpm run check:terms`: no forbidden term.
  `pnpm run check:format`: pass. `llms.txt` lists the page, and `/docs/migration.md` is prerendered.
- Browser (production server, port 3206, Playwright Chromium): `/docs/migration` returns 200 at 1280x800 and
  390x844, with the H1 "Migrate from 0.x", the nine H2 ids, Twoslash markup, no horizontal overflow, and no
  console error, page error or hydration warning. Screenshots: scratchpad `TK-066/migration-*.png`.

Decisions (owner decision 18):

- Template type `overview`: the plan lists `migration/index.mdx` with no type, and the guide's own headings
  do not fit the fixed headings of `guide`. `overview` fixes only `In short` and `Related`.
- `entry` lists the six entry points of the import table. `principles` and `examples` are empty: an overview
  page needs no catalogue id, and the example is a simplified team invites form, not a catalogue row.
- The two examples are longer than 25 lines. The limit of `04-documentation.md` section 8 is for reference
  pages and steps. The 0.x example is `no-check`, because the docs app installs only 0.7.0.
- `Related` links only the pages that exist now (the introduction and the repository).

Open: the agent trial on a 0.x application (acceptance item 4) runs separately, so the status stays
`in-progress`.
