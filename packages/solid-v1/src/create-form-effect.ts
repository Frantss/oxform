import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import type { MaybeAccessor } from '#types/maybe-accessor';
import { createEffect as createCoreEffect, type AnyFormLikeApi, type ApiSelector } from '@oxform/core';
import { createComputed, onCleanup, untrack } from 'solid-js';
import { isServer } from 'solid-js/web';

export const createFormEffect = <Api extends AnyFormLikeApi, Selected>(
  api: MaybeAccessor<Api>,
  selector: ApiSelector<Api, Selected>,
  callback: (selected: Selected) => void | Promise<void>,
): void => {
  requireOwner();
  if (isServer) return;
  createComputed(() => {
    const store = resolve(api).store;
    const subscription = untrack(() =>
      createCoreEffect({ store } as Api, selector, selected => untrack(() => callback(selected))),
    );
    onCleanup(() => subscription.unsubscribe());
  });
};
