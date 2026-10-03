import { createBinding } from '#internal/create-binding';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { BindingInput, FieldBindingOptions } from '#types/binding-options';
import {
  createField as createCoreField,
  type FieldApi,
  type FormFields,
  type FormFieldValue,
  type FormIssueLevels,
} from 'oxform-core';
import { createEffect, onCleanup, untrack } from 'solid-js';
import { isServer } from '@solidjs/web';

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

  if (!isServer)
    createEffect(
      () => ({ store: api.store, form: api.options.form, name: api.options.name }),
      ({ store, form, name }) => {
        release();
        registered = { store, unregister: () => form.field.unregister(name as never) };
        if (element && store.state.ref !== element) api.register(element);
      },
      { transparent: true },
    );
  onCleanup(release);

  return Object.create(api, {
    register: {
      enumerable: true,
      value: (ref: HTMLElement | null): void =>
        untrack(() => {
          if (!ref) return;
          release();
          element = ref;
          // Capture the binding: the public unregister method follows future path changes.
          const current = { form: api.options.form, name: api.options.name };
          registered = { store: api.store, unregister: () => current.form.field.unregister(current.name as never) };
          api.register(ref);
        }),
    },
    unregister: {
      enumerable: true,
      value: (): void =>
        untrack(() => {
          element = null;
          registered = undefined;
          api.unregister();
        }),
    },
  }) as FieldApi<FormFieldValue<Form, Name>, FormIssueLevels<Form>>;
};
