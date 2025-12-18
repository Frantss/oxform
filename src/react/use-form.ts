import { FormApi } from '#/core/form-api';
import type { FormOptions } from '#/core/form-api.types';
import type { StandardSchema } from '#/core/types';
import { useIsomorphicLayoutEffect } from '#/react/use-isomorphic-layout-effect';
import { useState } from 'react';

export type UseFormReturn<Schema extends StandardSchema> = FormApi<Schema>;

export const useForm = <Schema extends StandardSchema>(options: FormOptions<Schema>) => {
  const [api] = useState(() => {
    return new FormApi({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  return api satisfies UseFormReturn<Schema> as UseFormReturn<Schema>;
};
