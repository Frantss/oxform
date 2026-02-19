import type { AnyFormApi, FieldExtra, FormFieldExtra, FormFields, FormFieldValue } from 'oxform-core';
import { type FieldApi, type FieldOptions } from 'oxform-core';

import { useFieldApi } from '#use-field-api';
import { useStore } from '@tanstack/react-store';
import { useMemo } from 'react';

export type UseFieldReturn<Value, Extra extends FieldExtra> = FieldApi<Value, Extra>;

export const useField = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
): UseFieldReturn<FormFieldValue<Form, Name>, FormFieldExtra<Form, Name>> => {
  const api = useFieldApi(options);
  const id = useStore(api.store, state => state.id);
  const value = useStore(api.store, state => state.value);
  const defaultValue = useStore(api.store, state => state.defaultValue);
  const errors = useStore(api.store, state => state.errors);
  const ref = useStore(api.store, state => state.ref);
  const metaBlurred = useStore(api.store, state => state.meta.blurred);
  const metaTouched = useStore(api.store, state => state.meta.touched);
  const metaDirty = useStore(api.store, state => state.meta.dirty);
  const metaDefault = useStore(api.store, state => state.meta.default);
  const metaValid = useStore(api.store, state => state.meta.valid);
  const metaPristine = useStore(api.store, state => state.meta.pristine);

  return useMemo(() => {
    const state = {
      id,
      value,
      defaultValue,
      errors,
      ref,
      meta: {
        blurred: metaBlurred,
        touched: metaTouched,
        dirty: metaDirty,
        default: metaDefault,
        valid: metaValid,
        pristine: metaPristine,
      },
    };

    return Object.create(api, {
      id: {
        enumerable: true,
        get: () => id,
      },
      state: {
        enumerable: true,
        get: () => state,
      },
    });
  }, [
    api,
    id,
    value,
    defaultValue,
    errors,
    ref,
    metaBlurred,
    metaTouched,
    metaDirty,
    metaDefault,
    metaValid,
    metaPristine,
  ]) as UseFieldReturn<FormFieldValue<Form, Name>, FormFieldExtra<Form, Name>>;
};
