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
  const blurred = useStore(form.store, state => state.status.blurred);
  const touched = useStore(form.store, state => state.status.touched);
  const pristine = useStore(form.store, state => state.status.pristine);

  return useMemo(() => {
    return {
      dirty,
      valid,
      submitting,
      successful,
      validating,
      submits,
      submitted,
      blurred,
      touched,
      pristine,
    } satisfies UseFormStatusReturn;
  }, [dirty, valid, submitting, successful, validating, submits, submitted, blurred, touched, pristine]);
};
