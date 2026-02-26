import { createField, type FieldOptions } from 'oxform-core';

import type { UseFieldApiReturn } from '#types/use-field-api-return';
import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { AnyFormApi, FormFields } from 'oxform-core';
import { useState } from 'react';

export const useFieldApi = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
): UseFieldApiReturn<Form, Name> => {
  const [api] = useState(() => {
    return createField(options);
  });

  // todo: re-create api if form or name changes
  // spike: use optional context to cache the api instance

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  return api;
};
