import { createStoreState } from '#internal/create-store-state';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { AnyFormLikeApi, ApiSelector } from '@oxform/core';
import { createMemo, type Accessor } from 'solid-js';

export const createSubscribe = <Api extends AnyFormLikeApi, Selected>(
  api: MaybeAccessor<Api>,
  selector: ApiSelector<Api, Selected>,
): Accessor<Selected> => {
  const state = createStoreState(api);
  return createMemo(() => selector(state()), { equals: Object.is, transparent: true });
};
