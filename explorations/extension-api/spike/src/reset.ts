import type { EventsApi, Extendable, FormContext, Needs, ResetApi, StatusApi, ValidationApi, ValuesApi } from './api';
import { eventsInternals } from './events';
import { defineExtension } from './form';
import { getAt } from './paths';
import { statusInternals } from './status';

export function createReset<Values>(
  ctx: FormContext<{ readonly defaultValues: Values }>,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly validation?: ValidationApi<Values>;
    readonly events?: EventsApi<Values>;
  },
): ResetApi<Values> {
  const status = statusInternals(deps.status);

  /** Clears entries at a path and below. `keep` is `true` for every check, or the names to keep. */
  const clearChecks = (path?: string, keep?: boolean | readonly string[]) => {
    for (const check of deps.validation?.checks ?? []) {
      if (keep === true || (Array.isArray(keep) && keep.includes(check.name))) continue;
      check.clear(path as never);
    }
  };

  return {
    all(options = {}) {
      const { keep = {} } = options;
      deps.values.set('' as never, (options.values ?? ctx.options().defaultValues) as never, { reason: 'reset' });
      status.reset({ status: options.status, keepFields: keep.fields });
      if (!keep.fields) clearChecks(undefined, keep.checks);
      if (deps.events && !keep.refs && !keep.fields) eventsInternals(deps.events).clearRefs();
    },
    at(path, options = {}) {
      const value = options.value ?? getAt(ctx.options().defaultValues, path);
      deps.values.set(path, value as never, { reason: 'reset' });
      status.reset({ path });
      clearChecks(path);
    },
  };
}

/** `reset`: restores values, status, checks and refs, for the form or a path. Needs `values` and `status`; uses `validation` and `events` when present. */
export const reset = <Values>(
  form: Extendable<
    Values,
    Needs<Values, 'values' | 'status'> & {
      readonly validation?: ValidationApi<Values>;
      readonly events?: EventsApi<Values>;
    }
  >,
) =>
  defineExtension(form, {
    name: 'reset',
    api: (ctx, deps) => ({ reset: createReset<Values>(ctx, deps) }),
  });
