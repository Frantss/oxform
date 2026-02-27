import type { UseFormReturn } from '#types/use-form-return';
import { useFormStatus } from '#use-form-status';
import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import type { FormOptions } from 'oxform-core';
import { createForm } from 'oxform-core';
import { useMemo, useState } from 'react';

export const useForm = <Values>(options: FormOptions<Values>): UseFormReturn<Values> => {
  const [api] = useState(() => {
    return createForm({ ...options });
  });

  const status = useFormStatus({ form: api });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if id changes

  return useMemo(() => {
    return Object.create(api, {
      status: {
        enumerable: true,
        get: () => status,
      },
    });
  }, [api, status]) as UseFormReturn<Values>;
};
