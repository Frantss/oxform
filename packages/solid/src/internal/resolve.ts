import type { MaybeAccessor } from '#types/maybe-accessor';

export const resolve = <Value>(value: MaybeAccessor<Value>): Value =>
  typeof value === 'function' ? (value as () => Value)() : value;
