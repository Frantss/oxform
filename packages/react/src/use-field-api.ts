import { createField, type FieldApi, type FieldOptions } from 'oxform-core';

import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { AnyFormApi, FormFieldExtra, FormFields, FormFieldValue } from 'oxform-core';
import { useState } from 'react';

export type UseFieldApiReturn<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldApi<
  FormFieldValue<Form, Name>,
  FormFieldExtra<Form, Name>
>;

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

  return api as UseFieldApiReturn<Form, Name>;
};
