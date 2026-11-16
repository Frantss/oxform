import { getAt, setAt } from '#internal/paths';
import { defineExtension } from '#main/form';
import type { Path, PathValue, Unsubscribe, Updater } from '#main/path-types';
import type { Extendable, FormContext } from '#main/types';
import {
  createChange,
  type ChangeApi,
  type ChangeDetailsInput,
  type ChangeInterceptor,
  type ChangeListener,
} from './change';

export interface ValuesApi<Values> {
  get(): Values;
  get<At extends Path<Values>>(path: At): PathValue<Values, At>;
  /** Writes one path through the change pipeline. Returns `false` when it is canceled or the value is equal. */
  set<At extends Path<Values>>(
    path: At,
    updater: Updater<PathValue<Values, At>>,
    details?: ChangeDetailsInput,
  ): boolean;
  intercept(interceptor: ChangeInterceptor<Values>): Unsubscribe;
  onChange(listener: ChangeListener<Values>): Unsubscribe;
}

/** Reads and writes the `values` state slice, and runs every write through the change pipeline. */
export const createValues = <Values>(
  context: FormContext<unknown, { values: Values }>,
  deps: { readonly change: ChangeApi<Values> },
): ValuesApi<Values> => {
  const slice = context.state.values;

  return {
    get: ((path?: string) => (path === undefined ? slice.get() : getAt(slice.get(), path))) as ValuesApi<Values>['get'],
    set(path, updater, details) {
      const value =
        typeof updater === 'function' ? (updater as (current: unknown) => unknown)(getAt(slice.get(), path)) : updater;
      const write = (change: { readonly path: string; readonly value: unknown }) => {
        if (Object.is(getAt(slice.get(), change.path), change.value)) return false;
        slice.set(current => setAt(current, change.path, change.value));
        return true;
      };
      return deps.change.run({ path, value }, write, details);
    },
    intercept: interceptor => deps.change.intercept(interceptor),
    onChange: listener => deps.change.onChange(listener),
  };
};

/** `values`: the data of the form, and the change pipeline that every write goes through. It needs nothing. */
export const values = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'values',
    state: options => ({ values: options.defaultValues }),
    api: context => ({ values: createValues(context, { change: createChange<Values>() }) }),
  });
