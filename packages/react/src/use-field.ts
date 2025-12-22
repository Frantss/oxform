import type { AnyFormApi, EventLike, FieldState, FormFields, FormFieldValue } from 'oxform-core';
import { FieldApi, type FieldOptions } from 'oxform-core';

import { useFieldApi } from '#use-field-api';
import { useStore } from '@tanstack/react-store';
import { useMemo } from 'react';

export type UseFieldReturn<Value> = Omit<FieldApi<Value>, '~mount' | '~update' | 'state'> & {
  state: FieldState<Value>;
  props: {
    value: Value;
    ref: (element: HTMLElement | null) => void;
    onChange: (event: EventLike) => void;
    onBlur: (event: EventLike) => void;
    onFocus: (event: EventLike) => void;
  };
};

export const useField = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
): UseFieldReturn<FormFieldValue<Form, Name>> => {
  const api = useFieldApi(options);

  const value = useStore(api.store(), state => state.value);
  const defaultValue = useStore(api.store(), state => state.defaultValue);
  const dirty = useStore(api.store(), state => state.meta.dirty);
  const touched = useStore(api.store(), state => state.meta.touched);
  const blurred = useStore(api.store(), state => state.meta.blurred);
  const pristine = useStore(api.store(), state => state.meta.pristine);
  const valid = useStore(api.store(), state => state.meta.valid);
  const isDefault = useStore(api.store(), state => state.meta.default);
  const errors = useStore(api.store(), state => state.errors);

  return useMemo(() => {
    return {
      ...api,

      state: {
        value,
        defaultValue,
        errors,
        meta: {
          blurred,
          default: isDefault,
          dirty,
          pristine,
          touched,
          valid,
        },
      },

      props: {
        value,
        onBlur: api.blur,
        onFocus: api.focus,
        onChange: (event: EventLike) => api.change(event.target?.value),
        ref: api.register,
      },
    } satisfies UseFieldReturn<any> as any;
  }, [api, errors, value, defaultValue, dirty, touched, blurred, pristine, valid, isDefault]);
};
