# Null field snapshots

- `packages/core/src/utils/get.ts:6` uses nullish fallback when reading a property.
  A field whose form value is `null` therefore exposes `undefined` through
  `FieldApi.value`, `FieldApi.state.value`, and the corresponding array field
  reads, while `form.values` retains `null`. This matters for nullable schemas
  and adapters that present those field snapshots.
