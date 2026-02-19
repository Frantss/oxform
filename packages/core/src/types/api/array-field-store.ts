import type { ArrayLike } from '#types/misc/array-like';

export type ArrayFieldStore<Value extends ArrayLike> = {
  value: Value;
  defaultValue: Value;
};
