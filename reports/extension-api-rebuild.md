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
