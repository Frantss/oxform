# Establish Public Surface Inventory And Form Type Contract

Status: resolved
Blocked by: None

## Parent

`.scratch/create-use-api-type-tests/SPEC.md`

## What to build

Create the public API inventory for schema-dependent `create*` and `use*` surfaces, then add the first end-to-end type contract around form creation. A maintainer should be able to see which APIs must be covered and verify that form creation infers values, rejects invalid defaults, preserves field paths, and returns a schema-specific form API.

## Acceptance criteria

- [x] The public-surface inventory is derived from package exports rather than source-file name matching.
- [x] Implementation-only helpers with matching prefixes are explicitly excluded from the checklist.
- [x] A representative schema covers scalar fields, nested object fields, scalar arrays, object arrays, and nested array-object paths.
- [x] Form creation accepts valid schema-shaped options and rejects invalid default values.
- [x] The returned form API preserves exact field path and field value inference.
- [x] Validation and submit callback types are proven from the inferred schema values.
- [x] Existing checks/issues level inference remains covered for the form creation path.

## Answer

Added a public-surface inventory derived from package exports and covered `createForm` with schema-driven config, return, validation, submit callback, field-path, nested path, array path, invalid default value, invalid field path, and issue-level type assertions.

## Blocked by

- None - can start immediately.
