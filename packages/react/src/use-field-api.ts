import { createFieldApi, FieldApi, type FieldOptions } from 'oxform-core';

import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { AnyFormApi, FormFields, FormFieldValue } from 'oxform-core';
import { useState } from 'react';

export type UseFieldApiReturn<Value> = FieldApi<Value>;

export const useFieldApi = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
): UseFieldApiReturn<FormFieldValue<Form, Name>> => {
  const [api] = useState(() => {
    return createFieldApi(options);
  });

  // todo: re-create api if form or name changes
  // spike: use optional context to cache the api instance

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  return api;
};
