import type { ChangeApi, FormContext, Path, PathValue, Updater, ValuesApi } from '../../api';
import { getAt, segments, setAt } from './paths';

export function createValues<Values>(
  ctx: FormContext<{ readonly defaultValues: Values }>,
  deps: { readonly change: ChangeApi<Values> },
): ValuesApi<Values> {
  const slice = ctx.slice<Values>('values', ctx.options().defaultValues);

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
