import { createStoreState } from '#internal/create-store-state';
import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { AnyFormLikeApi, ApiSelector } from 'oxform-core';
import { isDeepEqual } from 'remeda';
import { createEffect, createMemo, untrack } from 'solid-js';
import { isServer } from '@solidjs/web';

export const createFormEffect = <Api extends AnyFormLikeApi, Selected>(
  api: MaybeAccessor<Api>,
  selector: ApiSelector<Api, Selected>,
  callback: (selected: Selected) => void | Promise<void>,
): void => {
  requireOwner();
  if (isServer) return;
  const state = createStoreState(api);
  const selected = createMemo(() => ({ store: resolve(api).store, value: selector(state()) }), {
    equals: (previous, next) => previous.store === next.store && isDeepEqual(previous.value, next.value),
    transparent: true,
  });
  let previousStore = untrack(() => selected().store);
  createEffect(
    selected,
    current => {
      if (current.store !== previousStore) {
        previousStore = current.store;
        return;
      }
      void callback(current.value);
    },
    { defer: true, transparent: true },
  );
};
