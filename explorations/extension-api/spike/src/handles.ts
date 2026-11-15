import type {
  ArraysApi,
  CheckApi,
  CheckEntry,
  EventsApi,
  Extendable,
  FormContext,
  Scope,
  Needs,
  ResetApi,
  StatusApi,
  ValidationApi,
  ValuesApi,
} from './api';
import { arraysInternals } from './arrays';
import { contextInternals } from './context';
import { eventsInternals } from './events';
import { defineExtension } from './form';
import { getAt, isWithin, joinPath } from './paths';

/**
 * The prefix a handle set is scoped to, under a symbol so spreading a handle set keeps it. It is not on `Scope`:
 * an adapter reads it to resolve a part's names against the scope it was given.
 */
const scopePrefix = Symbol.for('oxform.scope.prefix');
export const prefixOf = (handles: object | undefined): string =>
  (handles as { [scopePrefix]?: string } | undefined)?.[scopePrefix] ?? '';

/**
 * Builds `field`, `array` and `scope`. The ref and the item ids come from the behaviors' internals. Every field handle
 * is given the members that extensions declared in `fields`, through the context.
 */
export function createHandles<Values, Checks extends Readonly<Record<string, CheckApi<Values>>>>(
  ctx: FormContext<{ readonly id?: string; readonly defaultValues?: unknown }>,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly events: EventsApi<Values>;
    readonly reset: ResetApi<Values>;
    readonly arrays: ArraysApi<Values>;
    readonly checks: Checks;
  },
): Scope<Values, Extract<keyof Checks, string>> {
  const refs = eventsInternals(deps.events);
  const ids = arraysInternals(deps.arrays);
  const { decorateField } = contextInternals(ctx);
  const capitalize = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

  /**
   * The sugar's `setError` is for errors from outside validation, such as a server's. No validation run refreshes an
   * entry without an event, so it would block submit for good. It goes when the field, or an ancestor, next changes.
   */
  function setUntilChange(check: CheckApi<Values>, target: string, entries: readonly CheckEntry[], options?: never) {
    check.set(target as never, entries, options);
    const stop = deps.values.onChange(change => {
      if (!isWithin(target, change.path)) return;
      stop();
      const remaining = check.at(target as never).filter(entry => !entries.includes(entry));
      check.set(target as never, remaining);
    });
  }

  function handlesAt(prefix: string): Scope<any, any> {
    const full = (path: string) => joinPath(prefix, path);

    const field = (path: string) => {
      const target = full(path);
      const sugar = Object.fromEntries(
        Object.entries(deps.checks).flatMap(([name, check]) => [
          [name, (options?: { nested?: boolean }) => check.at(target as never, options)],
          [
            `set${capitalize(name)}`,
            (entries: readonly CheckEntry[], options?: never) => setUntilChange(check, target, entries, options),
          ],
        ]),
      );

      const handle = {
        get state() {
          return {
            id: `${ctx.options().id ?? ''}-${target}`,
            value: deps.values.get(target as never),
            defaultValue: getAt(ctx.options().defaultValues, target),
            ref: refs.ref(target),
            status: deps.status.at(target as never),
          };
        },
        get: () => deps.values.get(target as never),
        change: (updater: never, options?: never) => deps.events.change(target as never, updater, options),
        focus: (options?: never) => deps.events.focus(target as never, options),
        blur: (options?: never) => deps.events.blur(target as never, options),
        register: (element: HTMLElement | null) => deps.events.register(target as never)(element),
        unregister: () => deps.events.unregister(target as never),
        reset: (options?: never) => deps.reset.at(target as never, options),
        ...sugar,
      };
      // The path is relative to the scope, as a builder in `fields` expects it.
      return decorateField(handle, path);
    };

    const array = (path: string) => {
      const target = full(path) as never;
      const arrays = deps.arrays as any;
      return {
        get: () => deps.values.get(target),
        get ids() {
          return ids.ids(target);
        },
        append: (item: unknown, options?: unknown) => arrays.append(target, item, options),
        prepend: (item: unknown, options?: unknown) => arrays.prepend(target, item, options),
        insert: (index: number, item: unknown, options?: unknown) => arrays.insert(target, index, item, options),
        swap: (from: number, to: number, options?: unknown) => arrays.swap(target, from, to, options),
        move: (from: number, to: number, options?: unknown) => arrays.move(target, from, to, options),
        update: (index: number, item: unknown, options?: unknown) => arrays.update(target, index, item, options),
        remove: (index: number, options?: unknown) => arrays.remove(target, index, options),
        replace: (items: unknown, options?: unknown) => arrays.replace(target, items, options),
      };
    };

    return {
      field,
      array,
      scope: (nested: string) => handlesAt(full(nested)),
      [scopePrefix]: prefix,
    } as unknown as Scope<any, any>;
  }

  return handlesAt('') as unknown as Scope<Values, Extract<keyof Checks, string>>;
}

/** The names of the checks in an api: the members that are a `CheckApi` under their own name. */
export type CheckNamesOf<Api> = {
  [Name in keyof Api & string]: Api[Name] extends CheckApi<any, Name> ? Name : never;
}[keyof Api & string];

type HandlesNeeds<Values> = Needs<Values, 'values' | 'status' | 'events' | 'reset' | 'arrays'> & {
  readonly validation?: ValidationApi<Values>;
};

/**
 * `handles`: `field(path)`, `array(path)` and `scope(prefix)`, with the members of every extension's `fields`.
 *
 * The sugar on a field (`error()`, `setError(...)`) follows the checks that exist when `handles` is extended. In the
 * types they are the api members that are a `CheckApi` under their own name (`CheckNamesOf<Provides>`), read from the
 * form so far at `.extend`. At runtime they are `validation.checks`, in registration order. A check extended after
 * `handles` has neither.
 */
export const handles = <Values, Provides extends HandlesNeeds<Values>>(form: Extendable<Values, Provides>) =>
  defineExtension(form, {
    name: 'handles',
    api: (ctx, deps): Scope<Values, CheckNamesOf<Provides>> => {
      const checks = Object.fromEntries((deps.validation?.checks ?? []).map(check => [check.name, check]));
      return createHandles<Values, Record<string, CheckApi<Values>>>(ctx, { ...deps, checks }) as never;
    },
  });
