import type { AnyFormLikeApi } from '#types/form/any-form-like-api';
import type { ApiSelector } from '#types/form/api-selector';
import { Derived, Effect } from '@tanstack/store';
import { isDeepEqual } from 'remeda';

type EffectState<Selected> = {
  state: Selected;
  unchanged: boolean;
  skip: boolean;
};

export const createEffect = <Api extends AnyFormLikeApi, Selected>(
  api: Api,
  selector: ApiSelector<Api, Selected>,
  fn: (state: Selected) => void | Promise<void>,
) => {
  const store = new Derived({
    deps: [api.store],
    fn: ({ currDepVals, prevDepVals }) => {
      const currentStoreState = currDepVals[0] as never;
      const previousStoreState = prevDepVals?.[0] as never;

      const currentSelected = selector(currentStoreState);
      const previousSelected = previousStoreState ? selector(previousStoreState) : currentSelected;
      const unchanged = isDeepEqual(currentSelected, previousSelected);

      return {
        state: currentSelected,
        unchanged,
        skip: !prevDepVals,
      } satisfies EffectState<Selected>;
    },
  });

  return new Effect({
    deps: [store],
    fn: () => {
      if (store.state.skip) return;
      if (store.state.unchanged) return;
      void fn(store.state.state);
    },
  });
};
