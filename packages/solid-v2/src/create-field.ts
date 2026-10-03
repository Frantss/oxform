import { createFieldApi } from '#create-field-api';
import { createFieldState } from '#internal/create-field-state';
import type { CreateFieldReturn, FieldInputProps } from '#types/create-field-return';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { BindingInput, FieldBindingOptions } from '#types/binding-options';
import type { FormFields, FormFieldValue, FormIssueLevels } from 'oxform-core';

export const createField = <const Options extends BindingInput>(
  options: MaybeAccessor<FieldBindingOptions<Options>>,
): CreateFieldReturn<
  FormFieldValue<Options['form'], Extract<Options['name'], FormFields<Options['form']>>>,
  FormIssueLevels<Options['form']>
> => {
  type Form = Options['form'];
  type Name = Extract<Options['name'], FormFields<Form>>;
  const api = createFieldApi<Options>(options);
  const state = createFieldState(api);
  type Value = FormFieldValue<Options['form'], Extract<Options['name'], FormFields<Options['form']>>>;
  const props: FieldInputProps<Value> = {
    get value() {
      return state.value;
    },
    ref: api.register,
    onInput: event => {
      if (api.store.state.status) api.change(event.currentTarget.value as Value);
    },
    onBlur: event => {
      // Removed keyed rows can blur before Solid disposes their owners.
      const current = api.store.state;
      if (current.status && (!current.ref || current.ref === event.currentTarget)) api.blur();
    },
    onFocus: () => {
      if (api.store.state.status) api.focus();
    },
  };

  return Object.create(api, {
    id: { enumerable: true, get: () => state.id },
    value: { enumerable: true, get: () => state.value },
    state: { enumerable: true, get: () => state },
    props: { enumerable: true, get: () => props },
  }) as CreateFieldReturn<FormFieldValue<Form, Name>, FormIssueLevels<Form>>;
};
