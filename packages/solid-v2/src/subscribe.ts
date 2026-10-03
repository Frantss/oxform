import { createSubscribe } from '#create-subscribe';
import type { SubscribeProps } from '#types/subscribe-props';
import type { AnyFormLikeApi } from 'oxform-core';
import { createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';

export const Subscribe = <Api extends AnyFormLikeApi, Selected>(props: SubscribeProps<Api, Selected>): JSX.Element => {
  const selected = createSubscribe(
    () => props.api,
    state => props.selector(state),
  );
  return createMemo(() => props.children(selected), { transparent: true }) as unknown as JSX.Element;
};
