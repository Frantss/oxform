import type { ReadonlyStore } from '@tanstack/store';
import { isDeepEqual } from '#internal/paths';
import type { MaybePromise } from './path-types';

/**
 * Calls `effect` each time the selected value changes by deep equality. It is not called for the first selection.
 * An async effect is not awaited, so two runs may overlap. Do not call it inside `api`.
 */
export const createEffect = <State, Selected>(
  instance: { readonly store: ReadonlyStore<State> },
  selector: (state: State) => Selected,
  effect: (selected: Selected) => MaybePromise<void>,
): { unsubscribe(): void } => {
  let previous = selector(instance.store.state);
  const subscription = instance.store.subscribe(state => {
    const next = selector(state);
    if (isDeepEqual(next, previous)) return;
    previous = next;
    void effect(next);
  });

  return { unsubscribe: () => subscription.unsubscribe() };
};
