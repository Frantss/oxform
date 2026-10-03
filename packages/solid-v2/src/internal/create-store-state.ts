import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { AnyFormLikeApi } from 'oxform-core';
import { createMemo, createSignal, onCleanup, untrack, type Accessor } from 'solid-js';
import { isServer } from '@solidjs/web';

export const createStoreState = <Api extends AnyFormLikeApi>(
  api: MaybeAccessor<Api>,
): Accessor<Api['store']['state']> => {
  requireOwner();
  if (isServer) return () => resolve(api).store.state;

  const binding = createMemo(
    () => {
      const store = resolve(api).store;
      return untrack(() => {
        // Core notifications can arrive during owned ref or option updates.
        const [state, setState] = createSignal<Api['store']['state']>(store.state, { equals: false, ownedWrite: true });
        let active = true;
        const subscription = store.subscribe(value => {
          if (active) setState(() => value);
        });
        onCleanup(() => {
          active = false;
          subscription.unsubscribe();
        });
        return state;
      });
    },
    { transparent: true },
  );
  return () => binding()();
};
