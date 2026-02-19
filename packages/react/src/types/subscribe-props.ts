import type { AnyFormLikeApi, ApiSelector } from 'oxform-core';

export type SubscribeProps<Api extends AnyFormLikeApi, Selected> = {
  api: Api;
  selector: ApiSelector<Api, Selected>;
} & {
  children: React.ReactNode | ((field: Selected) => React.ReactNode);
};
