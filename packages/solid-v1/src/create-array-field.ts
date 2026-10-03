import { createBinding } from '#internal/create-binding';
import { createFieldState } from '#internal/create-field-state';
import { createSubscribe } from '#create-subscribe';
import type { CreateArrayFieldReturn } from '#types/create-array-field-return';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { ArrayBindingOptions, BindingInput } from '#types/binding-options';
import {
  createArrayField as createCoreArrayField,
  type ArrayLike,
  type FormArrayFields,
  type FormFieldValue,
  type FormIssueLevels,
} from 'oxform-core';
import { createMemo } from 'solid-js';

export const createArrayField = <const Options extends BindingInput>(
  options: MaybeAccessor<ArrayBindingOptions<Options>>,
): CreateArrayFieldReturn<
  Extract<FormFieldValue<Options['form'], Extract<Options['name'], FormArrayFields<Options['form']>>>, ArrayLike>,
  FormIssueLevels<Options['form']>
> => {
  type Form = Options['form'];
  type Name = Extract<Options['name'], FormArrayFields<Form>>;
  type Return = CreateArrayFieldReturn<Extract<FormFieldValue<Form, Name>, ArrayLike>, FormIssueLevels<Form>>;
  const api = createBinding(options, input => createCoreArrayField(input as never) as Return);
  const state = createFieldState(api);
  const selectedIds = createSubscribe(api, () => api.ids);
  const ids = createMemo(selectedIds, [], {
    equals: (previous, next) => previous.length === next.length && previous.every((id, index) => id === next[index]),
  });
  return Object.create(api, {
    state: { enumerable: true, get: () => state },
    ids: { enumerable: true, get: ids },
  }) as Return;
};
