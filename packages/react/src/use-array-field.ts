import { ArrayFieldApi, type DeepKeysOfType, type FieldOptions } from 'oxform-core';

import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { useSubscribe } from '#use-subscribe';
import type { DeepValue } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useMemo, useState } from 'react';

export type UseArrayFieldReturn<
  Schema extends StandardSchema,
  Name extends DeepKeysOfType<StandardSchema.InferInput<Schema>, any[] | null | undefined>,
  Value extends DeepValue<StandardSchema.InferInput<Schema>, Name> = DeepValue<StandardSchema.InferInput<Schema>, Name>,
> = Omit<ArrayFieldApi<Schema, Name, Value>, '~mount' | '~update'> & {
  fields: Value;
};

export const useArrayField = <
  Schema extends StandardSchema,
  Name extends DeepKeysOfType<StandardSchema.InferInput<Schema>, any[] | null | undefined>,
>(
  options: FieldOptions<Schema, Name>,
) => {
  type Value = DeepValue<StandardSchema.InferInput<Schema>, Name>;

  const [api] = useState(() => {
    return new ArrayFieldApi({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if form or name changes
  // spike: use optional context to cache the api instance

  const length = useSubscribe(api, state => Object.keys((state.value as unknown) ?? []).length);

  return useMemo(() => {
    void length;

    return {
      ...api,
      get fields() {
        return api.state().value as Value;
      },
    } satisfies UseArrayFieldReturn<Schema, Name, Value> as UseArrayFieldReturn<Schema, Name, Value>;
  }, [api, length]);
};
