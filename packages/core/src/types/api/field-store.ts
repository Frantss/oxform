import type { FieldState } from '#types/api/field-state';

export type FieldStore<Value> = {
  value: Value;
  defaultValue: Value;
} & FieldState;
