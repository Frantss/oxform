import { FieldApi, type FieldOptions } from '#/field-api';
import { FormApi, type FormOptions } from '#/form-api';
import type { SchemaLike } from '#/types';
import { useStore } from '@tanstack/react-store';
import { useLayoutEffect, useMemo, useState } from 'react';

import { useEffect } from 'react';

export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const useForm = <Schema extends SchemaLike>(options: FormOptions<Schema>) => {
  const [api] = useState(() => {
    return new FormApi({...options});
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  return api;
};

export const useField = (options: FieldOptions) => {
  const [api] = useState(() => {
    return new FieldApi({...options});
  });

  useIsomorphicLayoutEffect(api['~mount'], [api]);
  useIsomorphicLayoutEffect(() => {
    api['~update'](options);
  });

  const value = useStore(api.store, state => state.value);
  const defaultValue = useStore(api.store, state => state.defaultValue);

  return useMemo(() => {
    return {
      value,
      ...api.control(),
      props: {
        ...api.props(),
        value,
        defaultValue,
      }
    }
  }, [value]);
};
