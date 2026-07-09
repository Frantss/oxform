# Tickets: Create/Use API Type Tests

These tickets implement the compile-time schema-inference coverage described in `SPEC.md` for public `create*` and `use*` APIs.

Work the frontier: any ticket whose blockers are all done. The first ticket establishes the public surface and shared test shape; core and React coverage can then proceed in focused slices before final integration verification.

## 01 - Establish Public Surface Inventory And Form Type Contract

**What to build:** Create the public API inventory for schema-dependent `create*` and `use*` surfaces, then add the first end-to-end type contract around form creation. A maintainer should be able to see which APIs must be covered and verify that form creation infers values, rejects invalid defaults, preserves field paths, and returns a schema-specific form API.

**Blocked by:** None - can start immediately.

- [x] The public-surface inventory is derived from package exports rather than source-file name matching.
- [x] Implementation-only helpers with matching prefixes are explicitly excluded from the checklist.
- [x] A representative schema covers scalar fields, nested object fields, scalar arrays, object arrays, and nested array-object paths.
- [x] Form creation accepts valid schema-shaped options and rejects invalid default values.
- [x] The returned form API preserves exact field path and field value inference.
- [x] Validation and submit callback types are proven from the inferred schema values.
- [x] Existing checks/issues level inference remains covered for the form creation path.

## 02 - Cover Core Field, Array Field, And Effect Creation APIs

**What to build:** Add type tests for the remaining public core `create*` APIs that consume a schema-typed form or form-like API. Core field creation, array field creation, and effect creation should prove both valid configuration and schema-specific return or callback types.

**Blocked by:** 01 - Establish Public Surface Inventory And Form Type Contract.

- [x] Field creation accepts only schema-valid field names.
- [x] Field creation rejects unknown field paths.
- [x] Field creation returns state, default value, issue reads, and write methods typed for the selected field.
- [x] Array field creation accepts only schema-valid array field names.
- [x] Array field creation rejects scalar field names.
- [x] Array field creation returns list state and list operations typed for the selected array value.
- [x] Effect creation gives selectors a schema-typed store state.
- [x] Effect callbacks receive the selector result type without widening.

## 03 - Cover Direct React Hook Type Contracts

**What to build:** Add type tests for direct public React `use*` hooks whose options, selectors, or return values depend on the form schema. React users should get the same schema-driven safety as core users when using form, field, array field, status, effect, and subscription hooks.

**Blocked by:** 02 - Cover Core Field, Array Field, And Effect Creation APIs.

- [x] Form hook options infer values from the schema and reject invalid default values.
- [x] Form hook returns the same schema-specific form API shape as core form creation.
- [x] Field hook options accept only valid field names from the provided form.
- [x] Field hook returns state and props typed from the selected field value.
- [x] Field API hook returns a schema-specific field API.
- [x] Array field hook options accept only valid array field names and reject scalar field names.
- [x] Array field hook returns list state and operations typed from the selected array value.
- [x] Form status hook preserves issue-level typing from the form.
- [x] Form effect and subscription hooks preserve selector input and selected output types.

## 04 - Decide And Cover Generated Hook Surface

**What to build:** Resolve whether helper-generated hooks are part of the public React surface, then make the type-test matrix match that decision. If they are public, generated form, context, field, field API, and array field hooks should preserve schema-derived values, field names, array names, and issue levels. If they are not public, the checklist should document that exclusion clearly.

**Blocked by:** 03 - Cover Direct React Hook Type Contracts.

- [x] The helper-generated hook surface is classified as public or internal using package exports or an explicit maintainer-facing decision.
- [x] Public generated hooks, if any, infer form values from the configured schema.
- [x] Public generated field hooks, if any, accept only schema-valid field names.
- [x] Public generated array field hooks, if any, accept only schema-valid array field names.
- [x] Public generated hooks, if any, preserve issue-level typing from configured checks.
- [x] If the helper-generated hooks are internal, the final checklist explains why they are excluded from the required public matrix.

## 05 - Verify Matrix Completeness And Integration Type Check

**What to build:** Finish the coverage pass by checking the public inventory against the test matrix, removing any accidental casts from assertions, and running the integration verification needed for schema-inference contracts across core and React.

**Blocked by:** 02 - Cover Core Field, Array Field, And Effect Creation APIs; 03 - Cover Direct React Hook Type Contracts; 04 - Decide And Cover Generated Hook Surface.

- [x] Every public schema-dependent `create*` API has input-side and output-side type coverage.
- [x] Every public schema-dependent `use*` API has input-side and output-side type coverage.
- [x] Negative tests cover invalid field paths, scalar paths passed to array APIs, wrong default value shapes, wrong field writes, and callback assumptions that contradict the schema.
- [x] Assertions prove exact schema-derived types rather than broad `string`, `unknown`, `any`, or unspecific arrays.
- [x] Test setup avoids casts at the assertion boundary.
- [x] The relevant package test files pass.
- [x] Core package declarations are rebuilt first if downstream package checks depend on changed public core types.
- [x] The root type-check passes as the integration floor.
