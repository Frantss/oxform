import { createMemo, type Accessor } from 'solid-js';

export const selectProperties = <Value, Key extends keyof Value>(
  source: Accessor<Value>,
  keys: readonly Key[],
): Pick<Value, Key> => {
  const result = {} as Pick<Value, Key>;
  for (const key of keys) {
    const selected = createMemo(() => source()[key], undefined, { equals: Object.is });
    Object.defineProperty(result, key, { enumerable: true, get: selected });
  }
  return result;
};
