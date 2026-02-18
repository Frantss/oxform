import { ArrayFieldApi, createArrayField } from 'oxform-core';

import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { useSubscribe } from '#use-subscribe';
import type { AnyFormApi, ArrayFieldOptions, ArrayLike, FormArrayFields, FormFieldValue } from 'oxform-core';
import { useMemo, useState } from 'react';

export type UseArrayFieldReturn<Value extends ArrayLike> = Omit<ArrayFieldApi<Value>, '~mount' | '~update'> & {
  fields: Value;
};

export const useArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>(
  options: ArrayFieldOptions<Form, Name>,
): UseArrayFieldReturn<FormFieldValue<Form, Name>> => {
  const [api] = useState(() => {
    return createArrayField({ ...options });
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

    return Object.create(api, {
      fields: {
        enumerable: true,
        get: () => api.state.value,
      },
    }) as UseArrayFieldReturn<FormFieldValue<Form, Name>>;
  }, [api, length]);
};
