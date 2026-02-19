import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { useStore } from '@tanstack/react-store';
import type { FormApi, FormOptions } from 'oxform-core';
import { createForm } from 'oxform-core';
import { useMemo, useState } from 'react';

export type UseFormReturn<Values> = FormApi<Values>;

export const useForm = <Values>(options: FormOptions<Values>): UseFormReturn<Values> => {
  const [api] = useState(() => {
    return createForm({ ...options });
  });
  const statusSubmits = useStore(api.store, state => state.status.submits);
  const statusSubmitting = useStore(api.store, state => state.status.submitting);
  const statusValidating = useStore(api.store, state => state.status.validating);
  const statusSuccessful = useStore(api.store, state => state.status.successful);
  const statusDirty = useStore(api.store, state => state.status.dirty);
  const statusSubmitted = useStore(api.store, state => state.status.submitted);
  const statusValid = useStore(api.store, state => state.status.valid);

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if id changes

  return useMemo(() => {
    const status = {
      submits: statusSubmits,
      submitting: statusSubmitting,
      validating: statusValidating,
      successful: statusSuccessful,
      dirty: statusDirty,
      submitted: statusSubmitted,
      valid: statusValid,
    };

    return Object.create(api, {
      status: {
        enumerable: true,
        get: () => status,
      },
    });
  }, [
    api,
    statusSubmits,
    statusSubmitting,
    statusValidating,
    statusSuccessful,
    statusDirty,
    statusSubmitted,
    statusValid,
  ]) as UseFormReturn<Values>;
};
