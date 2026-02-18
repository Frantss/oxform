import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { FormApi, FormOptions } from 'oxform-core';
import { createForm } from 'oxform-core';
import { useState } from 'react';

export type UseFormReturn<Values> = FormApi<Values>;

export const useForm = <Values>(options: FormOptions<Values>) => {
  const [api] = useState(() => {
    return createForm({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if id changes

  return api satisfies UseFormReturn<Values> as UseFormReturn<Values>;
};
