import type { Accessor } from 'solid-js';

export type MaybeAccessor<Value> = Value | Accessor<Value>;
