import { createBinding } from '#internal/create-binding';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { BindingInput, FieldBindingOptions } from '#types/binding-options';
import {
  createField as createCoreField,
  type FieldApi,
  type FormFields,
  type FormFieldValue,
  type FormIssueLevels,
} from '@oxform/core';
import { createComputed, onCleanup, untrack } from 'solid-js';

export const createFieldApi = <const Options extends BindingInput>(
  options: MaybeAccessor<FieldBindingOptions<Options>>,
): FieldApi<
  FormFieldValue<Options['form'], Extract<Options['name'], FormFields<Options['form']>>>,
  FormIssueLevels<Options['form']>
> => {
  type Form = Options['form'];
  type Name = Extract<Options['name'], FormFields<Form>>;
  const api = createBinding(options, input =>
    createCoreField<Form, Name>({ form: input.form, name: input.name as Name }),
  );
  let element: HTMLElement | null = null;
  let registered: { store: typeof api.store; unregister: typeof api.unregister } | undefined;

  const release = (): void => {
    if (element && registered?.store.state.ref === element) registered.unregister();
  };

  createComputed(() => {
    const store = api.store;
    const { form, name } = api.options;
    untrack(() => {
      release();
      registered = { store, unregister: () => form.field.unregister(name as never) };
      if (element && store.state.ref !== element) api.register(element);
    });
  });
  onCleanup(release);

  return Object.create(api, {
    register: {
      enumerable: true,
      value: (ref: HTMLElement | null): void => {
        if (!ref) return;
        release();
        element = ref;
        // Capture the binding: the public unregister method follows future path changes.
        const current = { form: api.options.form, name: api.options.name };
        registered = { store: api.store, unregister: () => current.form.field.unregister(current.name as never) };
        api.register(ref);
      },
    },
    unregister: {
      enumerable: true,
      value: (): void => {
        element = null;
        registered = undefined;
        api.unregister();
      },
    },
  }) as FieldApi<FormFieldValue<Form, Name>, FormIssueLevels<Form>>;
};
