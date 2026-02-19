import type { AnyFormLikeApi } from '#types/form/any-form-like-api';

export type ApiSelector<Api extends AnyFormLikeApi, Selected> = (state: Api['store']['state']) => Selected;
