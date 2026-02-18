import { useStore } from '@tanstack/react-store';
import { type AnyFormLikeApi, type ApiSelector } from 'oxform-core';

export const useSubscribe = <Api extends AnyFormLikeApi, Selected>(api: Api, selector: ApiSelector<Api, Selected>) => {
  return useStore(api.store as never, selector as never) as Selected;
};
