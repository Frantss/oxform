# Comparison workspace

The two reference forms of [07-comparison.md](../../plans/extension-api/07-comparison.md), section 4.2,
written with each library in React. Each version follows the specification of its form and passes its shared
browser suite (`src/versions.spec.tsx`). The fairness rules are in section 4.6 of that plan.

```bash
vp run example-oxform-comparison#test
vp run example-oxform-comparison#check:types
```

## Review record

Reviewer of every version: Claude subagent (TK-056), pending owner review. Pinned versions are in
`package.json`. The documentation pages are the ones that match those versions.

### Oxform, lean chain and `standard`

Files: `src/*/oxform-lean.tsx`, `src/*/oxform-standard.tsx`, `src/sign-in/revalidate-after-submit.ts`.

Oxform has no published documentation for this API yet. The sources are the documentation plan and the
example kit that it publishes:

- [04-documentation.md](../../plans/extension-api/04-documentation.md), section 4.1: E01 (lean chain), E17
  (array rows), E18 (checks by event), E19 (server error from `onSubmit`).
- `examples/kit/src/sign-in.ts`, `sign-in-submit.ts` and `team-invites.ts`: E01, E19 and E18.
- [07-comparison.md](../../plans/extension-api/07-comparison.md), section 4.4: the two rows.

Notes:

- Sign-in validates on change after the first submit. Oxform has no option for this, so both rows add the
  extension `revalidateAfterSubmit`. Its bytes count in the size of both rows.
- The team invites lean row has no `handles`, so its rows are keyed by index.
- A lookup validator gets the full values (G2), so a blur looks up the valid addresses of every row and keeps
  only the issues of the blurred field.

### TanStack Form

Files: `src/*/tanstack-form.tsx`.

- [Dynamic validation](https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation):
  `revalidateLogic`, `onDynamic`.
- [Form and field validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation): field
  validators by event, `onBlurAsync`, field errors from `onSubmitAsync`, `canSubmit`.
- [Arrays](https://tanstack.com/form/latest/docs/framework/react/guides/arrays): `mode='array'`, `pushValue`,
  `removeValue`, `moveValue`.
- [`FormOptions`](https://tanstack.com/form/latest/docs/reference/interfaces/FormOptions):
  `canSubmitWhenInvalid`.

Notes:

- Sign-in sends the credentials in the `onSubmitAsync` validator, which sets the refusal on `password`.
- Team invites has field validators. A form validator does not run while a field has an error, and a field
  error makes `canSubmit` false, so the version sets `canSubmitWhenInvalid` to validate every field on
  submit.
- On blur, no sync validator gates `onBlurAsync`, so the lookup checks the format first.

### React Hook Form

Files: `src/*/react-hook-form.tsx`.

- [`useForm`](https://react-hook-form.com/docs/useform): `resolver`, `mode`, `reValidateMode`.
- [`register`](https://react-hook-form.com/docs/useform/register): `onBlur`, `valueAsNumber`.
- [`handleSubmit`](https://react-hook-form.com/docs/useform/handlesubmit): the `onInvalid` callback.
- [`setError`](https://react-hook-form.com/docs/useform/seterror), [`reset`](https://react-hook-form.com/docs/useform/reset).
- [`useFieldArray`](https://react-hook-form.com/docs/usefieldarray).
- [`@hookform/resolvers`, Valibot](https://github.com/react-hook-form/resolvers#valibot).

Notes:

- `mode` is form-wide and a resolver gets no event, so the lookup is not in the resolver. It runs on blur
  through `register`, and on submit after the resolver, valid or not.

### Formisch

Files: `src/*/formisch.tsx`.

- [Validation](https://formisch.dev/react/guides/validation/): `validate` and `revalidate`; the whole schema
  runs at each validation.
- [Handle submission](https://formisch.dev/react/guides/handle-submission/): `Form`, `onSubmit`.
- [Field arrays](https://formisch.dev/react/guides/field-arrays/): `FieldArray`, `insert`, `move`, `remove`.
- [`validate`](https://formisch.dev/methods/api/validate/), [`setErrors`](https://formisch.dev/methods/api/setErrors/).

Notes:

- Team invites uses `validate: 'input'` so that a member email validates on change before a submit. The whole
  schema runs, so an input in one field also shows the messages of the other fields, such as the team name.
- The lookup is not in the schema, because it would run on each input. It runs on blur and after
  `validate(form)` on submit. `Form` calls `onSubmit` only for valid input, so the version handles the
  `submit` event itself.
