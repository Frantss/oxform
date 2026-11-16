# Extension API rebuild

## 2026-11-16

- `packages/core/src/main/types.ts` (`NeedsMember`) with `Form.extend` (extension overload): an inline
  extension, `form.extend(form => defineExtension(form, { ... }))`, gets the whole form so far as its
  `Extendable` parameter. Every need is required and exact (D51), so on a form that already has an api or a
  state, the inline definition must list every api name and state key in `needs`, or it is a type error. A
  named extension with `Extendable<V, Needs<V, ...>>` is not affected. This matters for the docs and the
  examples, which use inline extensions. Options: document that an inline extension goes before the others
  or lists the form's names, or make `needs` optional when the parameter is a whole `Form`.
- `packages/core/src/main/types.ts` (`Form.extend`): D18 was checked. With the preset overload first, a
  rejected extension reports the extension overload's error, which reads better, but an inline extension then
  fails with TS2769, because TypeScript types its parameter from the first overload. The spike order stays.
- `packages/core/src/behaviors/events.ts` (`validate`): `events` starts a validation run with `void` and does not
  catch it, as in the spike (`spike/events.ts:47`). A validator that rejects during `change`, `focus` or `blur`
  gives an unhandled promise rejection, which fails a Vitest run and logs an error in a browser. Options: catch and
  drop the rejection, or report it through an option such as `onError`.

## The build drops `/* @__PURE__ */` from the slot groups

- What: `packages/core/src/behaviors/slots.ts` marks each `defineSlots` call `/* @__PURE__ */`, but
  `packages/core/dist/behaviors.js` holds no such annotation after `pnpm run build`.
- Why it matters: a bundler may keep every slot group of `@oxform/core/behaviors` in an app that spreads one.
  Plan risk R02 names the fallback: one module per group.
- Resolved on 2026-11-16: the current build keeps the annotations (`dist/behaviors-*.js`, each `defineSlots`
  call). An esbuild bundle of `dist/behaviors.js` that imports only `rootSlots` keeps `rootSlots` and drops the
  other four groups; one that imports only `values` keeps no slot group. The fallback is not needed.

## The React peer range allows versions that the adapter does not support

- What: `packages/react/package.json` declares `react` `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`. The merged
  ref of a part (`packages/react/src/part-view.ts`, `mergeRefs`) returns a cleanup, which only React 19 calls.
  React 18 calls the ref with `null` instead, and `attach` returns early for `null`.
- Why it matters: in React 18 the cleanup of `bind` never runs, so a field that leaves the tree stays
  registered and keeps its `values.onChange` listener. No test runs React 18. Resolved on 2026-11-16: the owner
  chose React 19 only, and the peer is now `^19.0.0`.

## `check:parity` fails until the Solid adapters catch up

- What: `packages/adapter-parity/scripts/check-parity.ts` passes only when the three built adapters export the
  same names. `@oxform/react` now exports 10 names, and the Solid stubs export `createParts` only.
- Why it matters: the script is not in `check:all` (02 puts it there), so it does not block now. TK-047 adds it
  once Solid (TK-043 to TK-047, out of scope here) has the same exports.

## Option kinds have no effect in an adapter (D34)

- What: the React `Root` read only the option names. No kind changed what it did, as G11 predicted.
- Resolved: the owner chose to remove the kinds. Options are a type only (`optionTypes`,
  `packages/core/src/main/form.ts`), and a duplicate option name is a type error of `extend`
  (`packages/core/src/main/types.ts`). `Root` takes the options in `options`, so `onSubmit` and other DOM props
  with an option name reach the element (`packages/react/src/create-parts.ts`).
- Decided: the duplicate-name check is a type error only, and the owner accepted that (2026-11-16). JavaScript
  callers get no runtime error for a duplicate option name; a duplicate check name still throws at create, through
  its state key.
- Limit: `standard` runs its chain on a form typed with no options, because a generic `Options` leaves the check
  undecided, and casts the result (`packages/core/src/presets/standard.ts`).

## The type coverage script exists twice

- What: `packages/core/scripts/check-type-coverage.ts` and `packages/react/scripts/check-type-coverage.ts`
  apply the same rule to different entries. `packages/adapter-parity/scripts/check-parity.ts` repeats the export
  parser of `packages/core/scripts/declarations.ts`.
- Why it matters: a change to the rule must be made in each copy. A root script that takes the entries and the
  inventory would remove the copies. It is a refactor outside the adapter tickets.

## Fixed in this session

- A consumer that exported a form failed declaration emit (TS2883): `SelfIssues` and `DefaultFieldStatus` were
  not exported. Both are public now. The core type tests cannot show the error, because inside the package
  TypeScript names the chunk by a relative path. The `check:types` of `@oxform/adapter-parity` shows it.
- G17: a programmatic `focus()` or `blur()` of a registered field ran status and validation twice. The guard is
  in `packages/core/src/behaviors/events.ts` (`move`), so every adapter gets it.
- `reset.all()` on values that were already the defaults discarded no pending validation run, and its issues
  arrived after the reset (`packages/core/src/behaviors/reset.ts`).
