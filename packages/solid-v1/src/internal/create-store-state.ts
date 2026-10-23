import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { AnyFormLikeApi } from '@oxform/core';
import { batch, createComputed, createSignal, onCleanup, untrack, type Accessor } from 'solid-js';
import { isServer } from 'solid-js/web';

export const createStoreState = <Api extends AnyFormLikeApi>(
  api: MaybeAccessor<Api>,
): Accessor<Api['store']['state']> => {
  requireOwner();
  if (isServer) return () => resolve(api).store.state;

  const [state, setState] = createSignal<Api['store']['state']>(
    untrack(() => resolve(api).store.state),
    { equals: false },
  );

  createComputed(() => {
    const store = resolve(api).store;
    untrack(() => setState(() => store.state));
    const subscription = store.subscribe(value => batch(() => setState(() => value)));
    onCleanup(() => subscription.unsubscribe());
  });

  return state;
};
