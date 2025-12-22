import type { AnyFormLikeApi } from '#types/any-form-like-api';

export type ApiSelector<Api extends AnyFormLikeApi, Selected> = (state: ReturnType<Api['store']>['state']) => Selected;
