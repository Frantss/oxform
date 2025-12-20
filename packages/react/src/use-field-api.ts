import { FieldApi, type FieldOptions } from 'oxform-core';

import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { DeepKeys } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useState } from 'react';

export type UseFieldApiReturn<Value> = FieldApi<any, any, Value>;

export const useFieldApi = <Schema extends StandardSchema, Name extends DeepKeys<StandardSchema.InferInput<Schema>>>(
  options: FieldOptions<Schema, Name>,
) => {
  const [api] = useState(() => {
    return new FieldApi({ ...options });
  });

  // todo: re-create api if form or name changes
  // spike: use optional context to cache the api instance

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  return api;
};
