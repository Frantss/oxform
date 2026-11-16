import { get } from '@oxform/core';
import { joinPath, prefixOf } from '@oxform/core/adapter';
import { createMemo, type Accessor } from 'solid-js';
import { useInstance } from '#context';
import { storeState } from '#part-view';

/** A hook takes `{ scope }` to read relative to a scope from `useScope` or `form.scope`. */
type Scoped = { readonly scope?: object };
type Handles = Record<'field' | 'array' | 'scope', (path: string) => object>;
type PathInput = string | Accessor<string>;

const read = (path: PathInput) => (typeof path === 'function' ? path() : path);

const sameEntries = (previous: readonly unknown[], next: readonly unknown[]) =>
  previous.every((value, index) => Object.is(value, next[index]));

/**
 * A handle that is the handle of the current path, and whose every read first reads `track`. In a reactive scope,
 * a read then follows what `track` selects.
 */
const tracking = <Handle extends object>(handle: Accessor<Handle>, track: Accessor<unknown>): Handle =>
  new Proxy({} as Handle, {
    get: (_target, name) => {
      track();
      const current = handle();
      const value: unknown = Reflect.get(current, name, current);
      return typeof value === 'function' ? value.bind(current) : value;
    },
  });

/**
 * The hooks of a form. A Solid component runs once, so a hook returns an accessor, or a handle whose reads track.
 * `useField` and `useArray` read the state keys `values` and `status` (G13).
 */
export const createHooks = (form: object) => {
  const useForm = () => useInstance(form);
  /** The handles that a path is relative to, the path from the root of the form, and the state of the store. */
  const useTarget = (path: PathInput, options?: Scoped) => {
    const instance = useForm();
    const scope = options?.scope;
    return {
      handles: (scope ?? instance) as Handles,
      full: () => joinPath(prefixOf(scope), read(path)),
      state: storeState(instance) as Accessor<{ readonly values: unknown; readonly status?: any }>,
    };
  };

  const useSelector = (
    selector: (state: any) => unknown,
    options?: { readonly compare?: (a: any, b: any) => boolean },
  ) => {
    const state = storeState(useForm());
    return createMemo(() => selector(state()), undefined, { equals: options?.compare ?? Object.is });
  };

  const useField = (path: PathInput, options?: Scoped) => {
    const { handles, full, state } = useTarget(path, options);
    const watched = createMemo(
      () => [get(state().values as never, full() as never), state().status?.fields[full()]],
      [],
      {
        equals: sameEntries,
      },
    );
    return tracking(
      createMemo(() => handles.field(read(path))),
      watched,
    );
  };

  const useArray = (path: PathInput, options?: Scoped) => {
    const { handles, full, state } = useTarget(path, options);
    const watched = createMemo(() => get(state().values as never, full() as never));
    return tracking(
      createMemo(() => handles.array(read(path))),
      watched,
    );
  };

  const useScope = (prefix: PathInput, options?: Scoped) => {
    const handles = (options?.scope ?? useForm()) as Handles;
    return tracking(
      createMemo(() => handles.scope(read(prefix))),
      () => {},
    );
  };

  return { useForm, useSelector, useField, useArray, useScope };
};
