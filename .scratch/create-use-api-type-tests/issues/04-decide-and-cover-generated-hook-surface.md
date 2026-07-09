# Decide And Cover Generated Hook Surface

Status: resolved
Blocked by: 03

## Parent

`.scratch/create-use-api-type-tests/SPEC.md`

## What to build

Resolve whether helper-generated hooks are part of the public React surface, then make the type-test matrix match that decision. If they are public, generated form, context, field, field API, and array field hooks should preserve schema-derived values, field names, array names, and issue levels. If they are not public, the checklist should document that exclusion clearly.

## Acceptance criteria

- [x] The helper-generated hook surface is classified as public or internal using package exports or an explicit maintainer-facing decision.
- [x] Public generated hooks, if any, infer form values from the configured schema.
- [x] Public generated field hooks, if any, accept only schema-valid field names.
- [x] Public generated array field hooks, if any, accept only schema-valid array field names.
- [x] Public generated hooks, if any, preserve issue-level typing from configured checks.
- [x] If the helper-generated hooks are internal, the final checklist explains why they are excluded from the required public matrix.

## Answer

Classified `defineForm` and its generated hooks as internal for this matrix because they are not exported from the React package. The exclusion is recorded in the public-surface inventory.

## Blocked by

- 03 - Cover Direct React Hook Type Contracts.
