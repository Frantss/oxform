import { createSubscribe } from '#create-subscribe';
import type { SubscribeProps } from '#types/subscribe-props';
import type { AnyFormLikeApi } from 'oxform-core';
import { createMemo, type JSX } from 'solid-js';

export const Subscribe = <Api extends AnyFormLikeApi, Selected>(props: SubscribeProps<Api, Selected>): JSX.Element => {
  const selected = createSubscribe(
    () => props.api,
    state => props.selector(state),
  );
  return createMemo(() => props.children(selected)) as unknown as JSX.Element;
};
