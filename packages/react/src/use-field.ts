import type { EventLike, FieldStore } from 'oxform-core';
import { FieldApi, type FieldOptions } from 'oxform-core';

import { useFieldApi } from '#use-field-api';
import { useStore } from '@tanstack/react-store';
import type { DeepKeys, DeepValue } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useMemo } from 'react';

export type UseFieldReturn<
  Schema extends StandardSchema,
  Name extends DeepKeys<StandardSchema.InferInput<Schema>> = DeepKeys<StandardSchema.InferInput<Schema>>,
  Value extends DeepValue<StandardSchema.InferInput<Schema>, Name> = DeepValue<StandardSchema.InferInput<Schema>, Name>,
> = Omit<FieldApi<Schema, Name, Value>, '~mount' | '~update' | 'state'> & {
  state: FieldStore<Value>;
  props: {
    value: Value;
    ref: (element: HTMLElement | null) => void;
    onChange: (event: EventLike) => void;
    onBlur: (event: EventLike) => void;
    onFocus: (event: EventLike) => void;
  };
};

export const useField = <Schema extends StandardSchema, Name extends DeepKeys<StandardSchema.InferInput<Schema>>>(
  options: FieldOptions<Schema, Name>,
) => {
  type Value = DeepValue<StandardSchema.InferInput<Schema>, Name>;

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
    } satisfies UseFieldReturn<Schema, Name, Value> as UseFieldReturn<Schema, Name, Value>;
  }, [api, errors, value, defaultValue, dirty, touched, blurred, pristine, valid, isDefault]);
};
