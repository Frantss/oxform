import { useSubscribe } from '#use-subscribe';
import type { SubscribeProps } from '#types/subscribe-props';
import type { AnyFormLikeApi } from 'oxform-core';
import { useMemo } from 'react';

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
