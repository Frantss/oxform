# Cover Core Field, Array Field, And Effect Creation APIs

Status: resolved
Blocked by: 01

## Parent

`.scratch/create-use-api-type-tests/SPEC.md`

## What to build

Add type tests for the remaining public core `create*` APIs that consume a schema-typed form or form-like API. Core field creation, array field creation, and effect creation should prove both valid configuration and schema-specific return or callback types.

## Acceptance criteria

- [x] Field creation accepts only schema-valid field names.
- [x] Field creation rejects unknown field paths.
- [x] Field creation returns state, default value, issue reads, and write methods typed for the selected field.
- [x] Array field creation accepts only schema-valid array field names.
- [x] Array field creation rejects scalar field names.
- [x] Array field creation returns list state and list operations typed for the selected array value.
- [x] Effect creation gives selectors a schema-typed store state.
- [x] Effect callbacks receive the selector result type without widening.

## Answer

Added core type tests for `createField`, `createArrayField`, and `createEffect`. Tightened the shared array-field typing so scalar field names are rejected and array API return values preserve the selected schema array value.

## Blocked by

- 01 - Establish Public Surface Inventory And Form Type Contract.
