import { getAt, isWithin, joinPath } from '#internal/paths';
import { contextInternals } from '#main/context';
import { defineExtension, scopePrefix } from '#main/form';
import { idPart } from '#main/path';
import type { ArrayItem, ArrayPath, ArrayValue, Path, PathValue, Updater } from '#main/path-types';
import type { CheckNamesOf, Extendable, FormContext, Needs, Scope } from '#main/types';
import { arraysInternals, type ArrayOperations } from './arrays';
import type { CheckEntry, CheckSetMode, CheckSugar } from './check';
import { eventsInternals, type FieldChangeOptions, type FieldFocusOptions } from './events';
import type { FieldStatus } from './status';

export interface FieldState<Value> {
  /** The form id and the path, made safe by `idPart`, as in the ids of the slots. */
  readonly id: string;
  readonly value: Value;
  readonly defaultValue: Value;
  readonly ref: HTMLElement | null;
  readonly status: FieldStatus;
}

export type FieldHandle<Values, At extends Path<Values>, Checks extends string = never> = {
  readonly state: FieldState<PathValue<Values, At>>;
  get(): PathValue<Values, At>;
  change(updater: Updater<PathValue<Values, At>>, options?: FieldChangeOptions): void;
  focus(options?: FieldFocusOptions): void;
  blur(options?: FieldFocusOptions): void;
  register(element: HTMLElement | null): void;
  unregister(): void;
  reset(options?: { readonly value?: PathValue<Values, At> }): void;
} & CheckSugar<Checks>;

export type ArrayHandle<Values, At extends ArrayPath<Values>> = ArrayOperations<
  ArrayItem<Values, At>,
  ArrayValue<Values, At>
> & {
  get(): ArrayValue<Values, At>;
  /** Stable item ids. They follow the items through swap, move and remove. */
  readonly ids: readonly string[];
};

/** A check as `handles` uses it, at a path of any scope. */
type LinkedCheck = {
  readonly name: string;
  at(path: string, options?: { readonly nested?: boolean }): readonly CheckEntry[];
  set(path: string, entries: readonly CheckEntry[], options?: { readonly mode?: CheckSetMode }): void;
};

type HandlesDeps = Needs<unknown, 'values' | 'status' | 'events' | 'reset' | 'arrays'>;

const capitalize = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/**
 * Builds `field`, `array` and `scope`. The check sugar follows the checks that `validation` has when this runs.
 * Each field handle gets the field members of the extensions, with its path relative to the scope.
 */
export const createHandles = <Values, Checks extends string = never>(
  context: FormContext<{ readonly id?: string; readonly defaultValues: Values }>,
  deps: HandlesDeps,
): Scope<Values, Checks> => {
  const refs = eventsInternals(deps.events);
  const ids = arraysInternals(deps.arrays);
  const internals = contextInternals(context);
  const checks = internals.validation().checks as readonly LinkedCheck[];
  const scopes = new Map<string, Scope<any, any>>();

  /**
   * Errors from outside validation, such as those of a server. No run refreshes them, so they go when the field or
   * an ancestor next changes, a reset included. Only the entries that this call set go.
   */
  const setUntilChange = (check: LinkedCheck, target: string, entries: readonly CheckEntry[], mode?: CheckSetMode) => {
    check.set(target, entries, { mode });
    const stop = deps.values.onChange(change => {
      if (!isWithin(target, change.path)) return;
      stop();
      check.set(
        target,
        check.at(target).filter(entry => !entries.includes(entry)),
      );
    });
  };

  const sugarOf = (target: string) =>
    Object.fromEntries(
      checks.flatMap(check => [
        [check.name, (options?: { readonly nested?: boolean }) => check.at(target, options)],
        [
          `set${capitalize(check.name)}`,
          (entries: readonly CheckEntry[], options?: { readonly mode?: CheckSetMode }) =>
            setUntilChange(check, target, entries, options?.mode),
        ],
      ]),
    );

  const scopeAt = (prefix: string): Scope<any, any> => {
    const cached = scopes.get(prefix);
    if (cached) return cached;
    const at = (path: string) => joinPath(prefix, path) as never;

    const field = (path: string) => {
      const target = at(path);
      const handle = {
        get state() {
          return {
            // `create` always sets an id.
            id: `${context.options().id!}-${idPart(target)}`,
            value: deps.values.get(target),
            defaultValue: getAt(context.options().defaultValues, target),
            ref: refs.ref(target),
            status: deps.status.at(target),
          };
        },
        get: () => deps.values.get(target),
        change: (updater: never, options?: FieldChangeOptions) => deps.events.change(target, updater, options),
        focus: (options?: FieldFocusOptions) => deps.events.focus(target, options),
        blur: (options?: FieldFocusOptions) => deps.events.blur(target, options),
        register: (element: HTMLElement | null) => deps.events.register(target)(element),
        unregister: () => deps.events.unregister(target),
        reset: (options?: { readonly value?: never }) => deps.reset.at(target, options),
        ...sugarOf(target),
      };
      return internals.decorateField(handle, path);
    };

    const array = (path: string) => {
      const target = at(path);
      const { arrays } = deps;
      return {
        get: () => deps.values.get(target),
        get ids() {
          return ids.ids(target);
        },
        append: (item: never, options?: FieldChangeOptions) => arrays.append(target, item, options),
        prepend: (item: never, options?: FieldChangeOptions) => arrays.prepend(target, item, options),
        insert: (index: number, item: never, options?: FieldChangeOptions) =>
          arrays.insert(target, index, item, options),
        swap: (from: number, to: number, options?: FieldChangeOptions) => arrays.swap(target, from, to, options),
        move: (from: number, to: number, options?: FieldChangeOptions) => arrays.move(target, from, to, options),
        update: (index: number, item: never, options?: FieldChangeOptions) =>
          arrays.update(target, index, item, options),
        remove: (index: number, options?: FieldChangeOptions) => arrays.remove(target, index, options),
        replace: (items: never, options?: FieldChangeOptions) => arrays.replace(target, items, options),
      };
    };

    const scope = { field, array, scope: (path: string) => scopeAt(at(path)), [scopePrefix]: prefix };
    scopes.set(prefix, scope as never);
    return scope as never;
  };

  return scopeAt('');
};

type HandlesNeeds<Values> = Needs<Values, 'values' | 'status' | 'events' | 'reset' | 'arrays'>;

/**
 * `handles`: `field(path)`, `array(path)` and `scope(path)`, with the field members of every extension. It needs
 * `values`, `status`, `events`, `reset` and `arrays`.
 *
 * The check sugar of a field (`error()`, `setError(entries)`) follows the checks applied before `handles`: in the
 * types, the check names of the api so far; at runtime, the checks of `validation` when the `api` of `handles`
 * runs. A check applied after `handles` has no sugar.
 */
export const handles = <Values, Provides extends HandlesNeeds<Values>>(form: Extendable<Values, Provides>) => {
  const needs: Extendable<Values, HandlesNeeds<Values>> = form;
  return defineExtension(needs, {
    name: 'handles',
    needs: { api: ['values', 'status', 'events', 'reset', 'arrays'] },
    api: (context, deps) => createHandles<Values, CheckNamesOf<Provides>>(context, deps as HandlesDeps),
  });
};
