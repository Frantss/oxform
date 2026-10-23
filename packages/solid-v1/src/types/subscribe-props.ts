import type { AnyFormLikeApi, ApiSelector } from '@oxform/core';
import type { Accessor, JSX } from 'solid-js';

export type SubscribeProps<Api extends AnyFormLikeApi, Selected> = {
  api: Api;
  selector: ApiSelector<Api, Selected>;
  children: (selected: Accessor<Selected>) => JSX.Element;
};
