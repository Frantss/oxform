import { get } from '@oxform/core';
import { shallow, useSelector } from '@tanstack/react-store';
import { useMemo } from 'react';
import { useInstance } from '#context';

/**
 * The hooks of a form. Each returns a plain value and renders the component again only when what it reads
 * changes. `useField` and `useArray` read the state keys `values` and `status` (G13).
 */
export const createHooks = (form: object) => {
  const useForm = () => useInstance(form);

  const useFormSelector = (
    selector: (state: any) => unknown,
    options?: { readonly compare?: (a: any, b: any) => boolean },
  ) => useSelector(useForm().store, selector, options);

  const useField = (path: string) => {
    const instance = useForm();
    useSelector(instance.store, state => [get(state.values, path), state.status?.fields[path]], { compare: shallow });
    return useMemo(() => instance.field(path), [instance, path]);
  };

  const useArray = (path: string) => {
    const instance = useForm();
    useSelector(instance.store, state => get(state.values, path));
    return useMemo(() => instance.array(path), [instance, path]);
  };

  return { useForm, useSelector: useFormSelector, useField, useArray };
};
