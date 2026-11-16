import { get } from '@oxform/core';
import { joinPath, prefixOf } from '@oxform/core/adapter';
import { shallow, useSelector } from '@tanstack/react-store';
import { useMemo } from 'react';
import { useInstance } from '#context';

/** A hook takes `{ scope }` to read relative to a scope from `useScope` or `form.scope`. */
type Scoped = { readonly scope?: object };
type Handles = Record<'field' | 'array' | 'scope', (path: string) => unknown>;

/**
 * The hooks of a form. Each returns a plain value and renders the component again only when what it reads
 * changes. `useField` and `useArray` read the state keys `values` and `status` (G13).
 */
export const createHooks = (form: object) => {
  const useForm = () => useInstance(form);
  /** The handles that a path is relative to, and the path from the root of the form. */
  const useTarget = (path: string, options?: Scoped) => {
    const instance = useForm();
    const scope = options?.scope;
    return { instance, handles: (scope ?? instance) as Handles, full: joinPath(prefixOf(scope), path) };
  };

  const useFormSelector = (
    selector: (state: any) => unknown,
    options?: { readonly compare?: (a: any, b: any) => boolean },
  ) => useSelector(useForm().store, selector, options);

  const useField = (path: string, options?: Scoped) => {
    const { instance, handles, full } = useTarget(path, options);
    useSelector(instance.store, state => [get(state.values, full), state.status?.fields[full]], { compare: shallow });
    return useMemo(() => handles.field(path), [handles, path]);
  };

  const useArray = (path: string, options?: Scoped) => {
    const { instance, handles, full } = useTarget(path, options);
    useSelector(instance.store, state => get(state.values, full));
    return useMemo(() => handles.array(path), [handles, path]);
  };

  const useScope = (prefix: string, options?: Scoped) => {
    const { handles } = useTarget(prefix, options);
    return useMemo(() => handles.scope(prefix), [handles, prefix]);
  };

  return { useForm, useSelector: useFormSelector, useField, useArray, useScope };
};
