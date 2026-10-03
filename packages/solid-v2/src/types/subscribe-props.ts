import type { AnyFormLikeApi, ApiSelector } from 'oxform-core';
import type { Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';

export type SubscribeProps<Api extends AnyFormLikeApi, Selected> = {
  api: Api;
  selector: ApiSelector<Api, Selected>;
  children: (selected: Accessor<Selected>) => JSX.Element;
};
