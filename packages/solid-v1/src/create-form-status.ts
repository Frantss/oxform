import { createStoreState } from '#internal/create-store-state';
import { selectFormStatus } from '#internal/select-form-status';
import { resolve } from '#internal/resolve';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { AnyFormApi, FormIssueLevels, FormStatus } from '@oxform/core';

export const createFormStatus = <Form extends AnyFormApi>(
  options: MaybeAccessor<{ form: Form }>,
): FormStatus<FormIssueLevels<Form>> => {
  const state = createStoreState(() => resolve(options).form);
  return selectFormStatus(() => state().status);
};
