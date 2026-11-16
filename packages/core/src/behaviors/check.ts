import type { StandardSchemaV1 } from '@standard-schema/spec';
import { isWithin } from '#internal/paths';
import { defineExtension, optionTypes } from '#main/form';
import type { Path } from '#main/path-types';
import type { Extendable, FormContext, Needs } from '#main/types';
import { isInScope, registerCheck, type CheckValidators, type ValidationApi, type ValidationEvent } from './validation';

/** A Standard Schema issue. The check adds `type`, the event of the validator that found it. */
export type CheckEntry = StandardSchemaV1.Issue & { readonly type?: ValidationEvent };

/** The entries of a check by path. The empty path `''` holds the issues of the whole form. */
export type CheckState = Readonly<Record<string, readonly CheckEntry[]>>;

export type CheckSetMode = 'replace' | 'append' | 'keep';

export interface CheckOptions {
  /** A blocking check with entries makes a run invalid. */
  readonly blocking?: boolean;
  /** The validators of the check replace every entry in the scope of a run, also the ones set by hand. */
  readonly exclusive?: boolean;
}

/** The empty path `''` is the root: `at('')`, `set('', entries)`, and `at('', { nested: true })` for every entry. */
export interface CheckApi<Values, Name extends string = string> {
  readonly name: Name;
  readonly blocking: boolean;
  at(path: Path<Values> | '', options?: { readonly nested?: boolean }): readonly CheckEntry[];
  set(path: Path<Values> | '', entries: readonly CheckEntry[], options?: { readonly mode?: CheckSetMode }): void;
  /** Removes the entries at a path and below, or every entry. */
  clear(path?: Path<Values> | ''): void;
  /** True when the check has a validator for the event, so a caller can skip a run that would do nothing. */
  validates(event: ValidationEvent): boolean;
}

/**
 * The members that `handles` adds to a field for each check: `error()` and `setError(entries)`. The entries of
 * `setError` are errors from outside validation, such as those of a server. They go when the field or an ancestor
 * next changes.
 */
export type CheckSugar<Checks extends string> = {
  readonly [Check in Checks]: (options?: { readonly nested?: boolean }) => readonly CheckEntry[];
} & {
  readonly [Check in Checks as `set${Capitalize<Check>}`]: (
    entries: readonly CheckEntry[],
    options?: { readonly mode?: CheckSetMode },
  ) => void;
};

/** Not on `CheckApi`: `arrays` moves the entries of a check with the items. */
export interface CheckInternals {
  /** Moves the entries under an array path as the items move. `undefined` drops the entries of an item. */
  remap(path: string, to: (index: number) => number | undefined): void;
}

const internals = new WeakMap<object, CheckInternals>();

export const checkInternals = (check: object): CheckInternals => {
  const found = internals.get(check);
  if (!found) throw new TypeError('checkInternals expects a check api made by the check extension.');
  return found;
};

const withoutEmpty = (entries: CheckState): CheckState =>
  Object.fromEntries(Object.entries(entries).filter(([, list]) => list.length > 0));

/** The entries of the check are the state slice of its name, and its validators the option of its name. */
export const createCheck = <Values, Name extends string>(
  context: FormContext<unknown, Record<Name, CheckState>>,
  deps: { readonly validation: ValidationApi<Values> },
  options: CheckOptions & { readonly name: Name },
): CheckApi<Values, Name> => {
  const { name, blocking = false, exclusive = false } = options;
  const slice = context.state[name];
  const validatorFor = (event: ValidationEvent) =>
    (context.options() as Record<string, CheckValidators<unknown> | undefined>)[name]?.[event];

  const check: CheckApi<Values, Name> = {
    name,
    blocking,
    at: (path, atOptions) =>
      atOptions?.nested
        ? Object.entries(slice.get()).flatMap(([key, entries]) => (isWithin(key, path) ? entries : []))
        : (slice.get()[path] ?? []),
    set(path, entries, setOptions) {
      const existing = slice.get()[path] ?? [];
      const mode = setOptions?.mode ?? 'replace';
      const next =
        mode === 'append' ? [...existing, ...entries] : mode === 'keep' && existing.length > 0 ? existing : entries;
      slice.set(current => withoutEmpty({ ...current, [path]: next }));
    },
    clear: (path = '') =>
      slice.set(current => Object.fromEntries(Object.entries(current).filter(([key]) => !isWithin(key, path)))),
    validates: event => validatorFor(event) !== undefined,
  };

  internals.set(check, {
    remap(path, to) {
      const prefix = `${path}.`;
      slice.set(current => {
        const next: Record<string, readonly CheckEntry[]> = {};
        for (const [key, entries] of Object.entries(current)) {
          if (!key.startsWith(prefix)) {
            next[key] = entries;
            continue;
          }
          const [index, ...rest] = key.slice(prefix.length).split('.');
          const moved = to(Number(index));
          if (moved !== undefined) next[[path, String(moved), ...rest].join('.')] = entries;
        }
        return next;
      });
    },
  });

  registerCheck(deps.validation, {
    check: check as CheckApi<unknown>,
    validatorFor,
    refresh(events, targets, incoming) {
      const next: Record<string, readonly CheckEntry[]> = {};
      for (const [path, entries] of Object.entries(slice.get())) {
        if (!isInScope(path, targets)) next[path] = entries;
        else if (!exclusive) next[path] = entries.filter(entry => !entry.type || !events.includes(entry.type));
      }
      for (const [path, entries] of incoming) next[path] = [...(next[path] ?? []), ...entries];
      slice.set(withoutEmpty(next));
    },
  });

  return check;
};

/**
 * `check('error', { blocking: true })`: a named check. It adds an option, a state slice and an api member, each with
 * the name of the check, and registers with `validation`. It needs `validation` (G5).
 */
export const check =
  <const Name extends string>(name: Name, options: CheckOptions = {}) =>
  <Values>(form: Extendable<Values, Needs<Values, 'validation'>>) =>
    defineExtension(form, {
      name: `check:${name}`,
      needs: { api: ['validation'] },
      options: optionTypes<Record<Name, CheckValidators<Values>>>(),
      // A key from a parameter widens to `string`, so these two casts state the name (01-public-api.md, 7.5).
      state: () => ({ [name]: {} }) as Record<Name, CheckState>,
      api: (context, { validation }) =>
        ({ [name]: createCheck(context, { validation }, { ...options, name }) }) as Record<
          Name,
          CheckApi<Values, Name>
        >,
    });
