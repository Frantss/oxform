import { createStoreState } from '#internal/create-store-state';
import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import { selectFormStatus } from '#internal/select-form-status';
import { selectProperties } from '#internal/select-properties';
import type { CreateFormReturn } from '#types/create-form-return';
import type { MaybeAccessor } from '#types/maybe-accessor';
import { createForm as createCoreForm, type FormChecksMap } from '@oxform/core';
import { createEffect, onCleanup, untrack } from 'solid-js';
import { isServer } from '@solidjs/web';

type CreateFormOptions<Values, Checks extends FormChecksMap<NoInfer<Values>, string> | undefined> = Parameters<
  typeof createCoreForm<Values, Checks>
>[0];

export const createForm = <Values, const Checks extends FormChecksMap<NoInfer<Values>, string> | undefined = {}>(
  options: MaybeAccessor<CreateFormOptions<Values, Checks>>,
): CreateFormReturn<Values, Checks> => {
  requireOwner();
  const api = untrack(() => createCoreForm<Values, Checks>({ ...resolve(options) }));
  onCleanup(api['~mount']());

  if (!isServer)
    createEffect(
      () => ({ ...resolve(options) }),
      current => api['~update'](current as Parameters<(typeof api)['~update']>[0]),
      { transparent: true },
    );

  const source = createStoreState(api);
  const status = selectFormStatus(() => source().status);
  const state = Object.assign(selectProperties(source, ['values', 'fields', 'issues']), { status });
  return Object.create(api, {
    status: { enumerable: true, get: () => status },
    state: { enumerable: true, get: () => state },
  }) as CreateFormReturn<Values, Checks>;
};
