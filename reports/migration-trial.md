# Migration guide trial (TK-066)

## The trial

- What: a coding agent migrated a 0.x application to 0.7.0, with `apps/docs/content/docs/migration/index.mdx`
  (commit `a586a7c`) as its only guide.
- Application: a copy of the 0.x `examples/react` from `main`. It has seven forms (`array`, `async`, `basic`,
  `checks`, `effect`, `issues`, `transform`), two shared status components and six browser tests. It ran in a
  separate worktree, against the workspace packages, and is not committed.
- Agent: a Claude Sonnet subagent, run by the coordinator of the extension API rebuild.
- Result of section 6 "Verify": the migration is complete.
  1. Type check: pass.
  2. Tests: 6 of 6 pass, after one test edit.
  3. Search A: only matches in application code (a `checks:` key and `.issues` ids in `main.tsx` and
     `playground.tsx`). No 0.x Oxform API is left.
  4. Browser: the seven forms pass a Playwright script.
- Why it matters: the guide is enough to migrate an application with no other source. The agent reported the
  gaps below. Each was checked on the built packages (React browser tests and `tsc --noEmit` probes on
  `packages/*/dist`, after `eccecd1`) before the guide changed.

## Gaps and what changed

References are to `plans/extension-api/05-migration-guide.md`. The page has the same text.

| #   | Gap                                                                | Checked fact                                                                                                                                                                                                            | Change                                                         |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | `pnpm add @oxform/core@0.7.0` against a `workspace:*` app at 0.6.0 | An artifact of a workspace trial: the release (TK-072) sets the versions. Section 1, step 3, already says that `@oxform/core` is a peer of each adapter (`packages/react/package.json`, `packages/solid/package.json`). | None                                                           |
| 2   | `<Field>` and DOM attributes, `render` with `textarea` or `select` | `className`, `placeholder`, `autoComplete`, `min`, `max`, `step` reach the element. A `render` element keeps its props, and typing and selecting write the value.                                                       | `<Field form name>` row (`:146`)                               |
| 3   | The state of `<Submit>` children                                   | `{ submitting, submits, successful }`, no `validating`. `Submit` has `disabled` and `data-submitting` while submitting.                                                                                                 | `<Subscribe>` row (`:148`)                                     |
| 4   | A hook in the component that renders `Root`                        | It type-checks and throws `oxform: call this inside the Root of the same form object. ...` at render. The message is clear, so no package finding.                                                                      | Section 4, last row (`:179`); section 5, step 4 (`:189`)       |
| 5   | Types for shared components                                        | `FieldHandle` has no default for the values and the path: `FieldHandle<ValuesOf<typeof form>, 'email', 'error'>` takes `useField('email')`.                                                                             | New row "props of shared components" (`:151`)                  |
| 6   | Validators and options from props                                  | A validator function gets `{ values }`, not the store. A changed `options` prop of `Root` applies at the next submit.                                                                                                   | `checks.error.validate` row (`:105`), new options row (`:106`) |
| 7   | Entry type and the `Path` of a prop                                | `state.error[path]` is `CheckEntry[]`, and `undefined` for a path with no entries. `Path<ValuesOf<typeof form>>` types a name prop.                                                                                     | State row (`:124`), new shared-components row (`:151`)         |
| 8   | Field ids and a reorder                                            | After `swap(0, 1)`, `members-0-name` holds the value of the second row: an id follows the path, not the item.                                                                                                           | Ids row of section 4 (`:170`)                                  |
| 9   | Search A cannot return nothing                                     | `checks:` and `.issues` match application code.                                                                                                                                                                         | Section 6, step 3 (`:286`)                                     |
| 10  | A field-level `useFormEffect`                                      | `createEffect(instance, state => get(state.values, name), fn)` type-checks, with `get` from `@oxform/core`.                                                                                                             | `useFormEffect` row (`:145`)                                   |
| 11  | `<Reset>` and `onClick`                                            | An author `onClick` runs, and the part calls `reset.all()`: values, field state, entries and form status.                                                                                                               | New row "a reset button" (`:150`)                              |
