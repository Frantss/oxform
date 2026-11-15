import type { ChangeApi, Extendable, FormContext, Path, PathValue, Updater, ValuesApi } from './api';
import { createChange } from './change';
import { defineExtension } from './form';
import { getAt, segments, setAt } from './paths';

/** The behavior. It reads and writes the `values` state slice, and runs every write through the change pipeline. */
export function createValues<Values>(
  ctx: FormContext<unknown, { values: Values }>,
  deps: { readonly change: ChangeApi<Values> },
): ValuesApi<Values> {
  const slice = ctx.state.values;

  const get = ((path?: string) =>
    path === undefined ? slice.get() : getAt(slice.get(), path)) as ValuesApi<Values>['get'];

  return {
    get,
    set<P extends Path<Values>>(path: P, updater: Updater<PathValue<Values, P>>, details = {}) {
      const current = getAt(slice.get(), path) as PathValue<Values, P>;
      const value =
        typeof updater === 'function'
          ? (updater as (value: PathValue<Values, P>) => PathValue<Values, P>)(current)
          : updater;
      return deps.change.run(
        { path, value },
        change => {
          if (Object.is(getAt(slice.get(), change.path), change.value)) return false;
          slice.set(values => setAt(values, segments(change.path), change.value));
          return true;
        },
        details,
      );
    },
    intercept: interceptor => deps.change.intercept(interceptor),
    onChange: listener => deps.change.onChange(listener),
  };
}

/** `values`: the form's data, and the change pipeline that every write goes through. Needs nothing. */
export const values = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'values',
    state: options => ({ values: options.defaultValues }),
    api: ctx => ({ values: createValues(ctx, { change: createChange<Values>() }) }),
  });
