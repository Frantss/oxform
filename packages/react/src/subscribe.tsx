import { useSubscribe } from '#use-subscribe';
import type { AnyFormLikeApi, ApiSelector } from 'oxform-core';
import { useMemo } from 'react';

export type SubscribeProps<Api extends AnyFormLikeApi, Selected> = {
  api: Api;
  selector: ApiSelector<Api, Selected>;
} & {
  children: React.ReactNode | ((field: Selected) => React.ReactNode);
};

export const Subscribe = <Api extends AnyFormLikeApi, Selected>({
  api,
  selector,
  children,
}: SubscribeProps<Api, Selected>) => {
  const selected = useSubscribe(api, selector);

  return useMemo(() => {
    return typeof children === 'function' ? children(selected as never) : children;
  }, [children, selected]);
};
