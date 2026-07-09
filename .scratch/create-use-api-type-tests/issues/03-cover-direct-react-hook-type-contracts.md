# Cover Direct React Hook Type Contracts

Status: resolved
Blocked by: 02

## Parent

`.scratch/create-use-api-type-tests/SPEC.md`

## What to build

Add type tests for direct public React `use*` hooks whose options, selectors, or return values depend on the form schema. React users should get the same schema-driven safety as core users when using form, field, array field, status, effect, and subscription hooks.

## Acceptance criteria

- [x] Form hook options infer values from the schema and reject invalid default values.
- [x] Form hook returns the same schema-specific form API shape as core form creation.
- [x] Field hook options accept only valid field names from the provided form.
- [x] Field hook returns state and props typed from the selected field value.
- [x] Field API hook returns a schema-specific field API.
- [x] Array field hook options accept only valid array field names and reject scalar field names.
- [x] Array field hook returns list state and operations typed from the selected array value.
- [x] Form status hook preserves issue-level typing from the form.
- [x] Form effect and subscription hooks preserve selector input and selected output types.

## Answer

Added React hook type tests for `useForm`, `useField`, `useFieldApi`, `useArrayField`, `useFormStatus`, `useFormEffect`, and `useSubscribe`. Updated React array wrapper internals and render prop types to preserve extracted schema array values.

## Blocked by

- 02 - Cover Core Field, Array Field, And Effect Creation APIs.
