import type { ArrayFieldApi, ArrayLike } from 'oxform-core';

export type CreateArrayFieldReturn<Value extends ArrayLike, Level extends string = string> = ArrayFieldApi<
  Value,
  Level
>;
