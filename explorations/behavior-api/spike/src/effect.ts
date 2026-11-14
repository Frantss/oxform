import type { ReadonlyStore } from '@tanstack/store';
import type { MaybePromise } from '../../api';
import { isDeepEqual } from './paths';

/** Calls `effect` when the selected value changes by deep equality. It is not called for the initial selection. */
export function createEffect<State, Selected>(
  instance: { readonly store: ReadonlyStore<State> },
  selector: (state: State) => Selected,
  effect: (selected: Selected) => MaybePromise<void>,
): { unsubscribe(): void } {
  let previous = selector(instance.store.state);

  const subscription = instance.store.subscribe(state => {
    const next = selector(state);
    if (isDeepEqual(next, previous)) return;

    previous = next;
    void effect(next);
  });

  return { unsubscribe: () => subscription.unsubscribe() };
}
