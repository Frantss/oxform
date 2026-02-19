import { useStore } from '@tanstack/react-store';
import type { UseFormStatusProps } from '#types/use-form-status-props';
import type { UseFormStatusReturn } from '#types/use-form-status-return';
import { useMemo } from 'react';

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
