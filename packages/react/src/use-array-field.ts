import { ArrayFieldApi, createArrayField } from 'oxform-core';

import { useIsomorphicLayoutEffect } from '#use-isomorphic-layout-effect';
import { useStore } from '@tanstack/react-store';
import type { AnyFormApi, ArrayFieldOptions, ArrayLike, FormArrayFields, FormFieldValue } from 'oxform-core';
import { useMemo, useState } from 'react';

export type UseArrayFieldReturn<Value extends ArrayLike> = ArrayFieldApi<Value>;

export const useArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>(
  options: ArrayFieldOptions<Form, Name>,
): UseArrayFieldReturn<FormFieldValue<Form, Name>> => {
  const [api] = useState(() => {
    return createArrayField({ ...options });
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  // todo: re-create api if form or name changes
  // spike: use optional context to cache the api instance

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
  ]) as UseArrayFieldReturn<FormFieldValue<Form, Name>>;
};
