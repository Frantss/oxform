import { useStore } from '@tanstack/react-store';
import type { FormApi, FormStatus } from 'oxform-core';
import { useMemo } from 'react';

export type UseFormStatusProps<Values> = {
  form: FormApi<Values>;
};

export type UseFormStatusReturn = FormStatus;

export const useFormStatus = <Values>({ form }: UseFormStatusProps<Values>): UseFormStatusReturn => {
  const dirty = useStore(form.store, state => state.status.dirty);
  const valid = useStore(form.store, state => state.status.valid);
  const submitting = useStore(form.store, state => state.status.submitting);
  const successful = useStore(form.store, state => state.status.successful);
  const validating = useStore(form.store, state => state.status.validating);
  const submits = useStore(form.store, state => state.status.submits);
  const submitted = useStore(form.store, state => state.status.submitted);

  return useMemo(() => {
    return {
      dirty,
      valid,
      submitting,
      successful,
      validating,
      submits,
      submitted,
    } satisfies UseFormStatusReturn;
  }, [dirty, valid, submitting, successful, validating, submits, submitted]);
};
