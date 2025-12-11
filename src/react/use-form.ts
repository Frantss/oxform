import { FormApi, type FormOptions } from '#/core/form-api';
import type { SchemaLike } from '#/core/types';
import { useIsomorphicLayoutEffect } from '#/react/use-isomorphic-layout-effect';
import { useState } from 'react';

export type UseFormReturn<Schema extends SchemaLike> = FormApi<Schema>;

export const useForm = <Schema extends SchemaLike>(options: FormOptions<Schema>) => {
  const [api] = useState(() => {
    return new FormApi({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  return api satisfies UseFormReturn<Schema> as UseFormReturn<Schema>;
};
