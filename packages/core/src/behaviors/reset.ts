import { getAt } from '#internal/paths';
import { contextInternals } from '#main/context';
import { defineExtension } from '#main/form';
import type { Path, PathValue } from '#main/path-types';
import type { Extendable, FormContext, Needs } from '#main/types';
import { eventsInternals, type EventsApi } from './events';
import { statusInternals, type FormStatusDefaults, type StatusApi } from './status';
import type { ValuesApi } from './values';

export interface ResetOptions<Values> {
  /** The values to start from. The default values of the form do not change. */
  readonly values?: Values;
  /** Overrides of the form status after the reset. */
  readonly status?: FormStatusDefaults;
  readonly keep?: {
    /** `true` keeps the entries of every check, or a list keeps the checks of those names. */
    readonly checks?: boolean | readonly string[];
    /** Keeps the element refs of `events`. */
    readonly refs?: boolean;
    /** Keeps the field state, the entries and the refs. It wins over the other flags. */
    readonly fields?: boolean;
  };
}

export interface ResetApi<Values> {
  /** Restores the values, the field state, the entries, the form status and the element refs. */
  all(options?: ResetOptions<Values>): void;
  /** Restores one subtree: its value, its field state and its entries. It takes no status and no `keep` (01-public-api.md, 8). */
  at<At extends Path<Values>>(path: At, options?: { readonly value?: PathValue<Values, At> }): void;
}

/** What `reset` reads of a check through the validation link. */
type LinkedCheck = { readonly name: string; clear(path?: string): void };

/** A write of the values makes a pending validation run stale, so reset discards it and does not validate. */
export const createReset = <Values>(
  context: FormContext<{ readonly defaultValues: Values }>,
  deps: { readonly values: ValuesApi<Values>; readonly status: StatusApi<Values>; readonly events: EventsApi<Values> },
): ResetApi<Values> => {
  const status = statusInternals(deps.status);
  const clearChecks = (path?: string, keep?: boolean | readonly string[]) => {
    for (const check of contextInternals(context).validation().checks as readonly LinkedCheck[]) {
      if (keep === true || (Array.isArray(keep) && keep.includes(check.name))) continue;
      check.clear(path);
    }
  };

  return {
    all({ values, status: override, keep = {} } = {}) {
      deps.values.set('' as never, (values ?? context.options().defaultValues) as never, { reason: 'reset' });
      // A reset to equal values writes nothing, so it discards the pending runs itself.
      contextInternals(context).validation().discard();
      status.reset({ status: override, keepFields: keep.fields });
      if (keep.fields) return;
      clearChecks(undefined, keep.checks);
      if (!keep.refs) eventsInternals(deps.events).clearRefs();
    },
    at(path, options = {}) {
      const value = 'value' in options ? options.value : getAt(context.options().defaultValues, path);
      deps.values.set(path, value as never, { reason: 'reset' });
      contextInternals(context).validation().discard(path);
      status.reset({ path });
      clearChecks(path);
    },
  };
};

/** `reset`: restores the values, the status, the entries and the refs, of the form or of one path. */
export const reset = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'status' | 'events'>>) =>
  defineExtension(form, {
    name: 'reset',
    needs: { api: ['values', 'status', 'events'] },
    api: (context, deps) => ({ reset: createReset<Values>(context, deps) }),
  });
