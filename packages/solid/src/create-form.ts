import { createFormStatus } from '#create-form-status';
import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import type { CreateFormReturn } from '#types/create-form-return';
import type { MaybeAccessor } from '#types/maybe-accessor';
import { createForm as createCoreForm, type FormChecksMap } from 'oxform-core';
import { createComputed, onCleanup, untrack } from 'solid-js';

type CreateFormOptions<Values, Checks extends FormChecksMap<NoInfer<Values>, string> | undefined> = Parameters<
  typeof createCoreForm<Values, Checks>
>[0];

export const createForm = <Values, const Checks extends FormChecksMap<NoInfer<Values>, string> | undefined = {}>(
  options: MaybeAccessor<CreateFormOptions<Values, Checks>>,
): CreateFormReturn<Values, Checks> => {
  requireOwner();
  const api = untrack(() => createCoreForm<Values, Checks>({ ...resolve(options) }));
  onCleanup(api['~mount']());

  createComputed(() => {
    const current = { ...resolve(options) };
    untrack(() => api['~update'](current as Parameters<(typeof api)['~update']>[0]));
  });

  const status = createFormStatus({ form: api });
  return Object.create(api, { status: { enumerable: true, get: () => status } }) as CreateFormReturn<Values, Checks>;
};
