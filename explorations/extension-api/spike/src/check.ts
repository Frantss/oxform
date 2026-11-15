import type {
  CheckApi,
  CheckEntry,
  CheckOptions,
  CheckState,
  EventValidators,
  Extendable,
  FormContext,
  Needs,
  OptionDescriptor,
  ValidationApi,
  ValidationEvent,
  ValuesApi,
} from './api';
import { defineExtension, option } from './form';
import { isWithin } from './paths';
import { isInScope, registerCheck } from './validation';

type Entries = Readonly<Record<string, readonly CheckEntry[]>>;

const withoutEmpty = (entries: Entries): Entries =>
  Object.fromEntries(Object.entries(entries).filter(([, list]) => list.length > 0));

/** Not on `CheckApi`. Arrays move a check's entries with the items, through `checkInternals(check)`. */
export interface CheckInternals {
  /** Moves entries under an array path as items move. `undefined` drops the item's entries. */
  remap(path: string, to: (index: number) => number | undefined): void;
}

const internals = new WeakMap<object, CheckInternals>();

export function checkInternals(check: object): CheckInternals {
  const found = internals.get(check);
  if (!found) throw new Error('This behavior needs a check created by createCheck.');
  return found;
}

/** The behavior. Its entries are the state slice named by the check, and its validators the option of that name. */
export function createCheck<Values, Name extends string>(
  ctx: FormContext<unknown, Record<Name, CheckState>>,
  deps: { readonly values: ValuesApi<Values>; readonly validation: ValidationApi<Values> },
  options: CheckOptions<Name>,
): CheckApi<Values, Name> {
  const { name, blocking = false, exclusive = false } = options;
  const slice = ctx.state[name];
  const validatorFor = (event: ValidationEvent) =>
    (ctx.options() as Record<string, EventValidators<any> | undefined>)[name]?.[event];

  const check: CheckApi<Values, Name> = {
    name,
    blocking,
    at(path, atOptions) {
      if (!atOptions?.nested) return slice.get()[path] ?? [];
      return Object.entries(slice.get()).flatMap(([key, entries]) => (isWithin(key, path) ? [...entries] : []));
    },
    set(path, entries, setOptions) {
      const existing = slice.get()[path] ?? [];
      const mode = setOptions?.mode ?? 'replace';
      const next =
        mode === 'append' ? [...existing, ...entries] : mode === 'keep' && existing.length > 0 ? existing : entries;
      slice.set(current => withoutEmpty({ ...current, [path]: next }));
    },
    clear(path) {
      slice.set(current =>
        withoutEmpty(Object.fromEntries(Object.entries(current).filter(([key]) => !isWithin(key, path ?? '')))),
      );
    },
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
          const [index = '', ...rest] = key.slice(prefix.length).split('.');
          const moved = to(Number(index));
          if (moved !== undefined) next[[path, String(moved), ...rest].join('.')] = entries;
        }
        return next;
      });
    },
  });

  registerCheck(deps.validation, {
    check,
    validatorFor,
    refresh(events, targets, incoming) {
      const next: Record<string, readonly CheckEntry[]> = {};
      for (const [path, entries] of Object.entries(slice.get())) {
        const kept = !isInScope(path, targets)
          ? entries
          : exclusive
            ? []
            : entries.filter(entry => !entry.type || !events.includes(entry.type));
        next[path] = kept;
      }
      for (const [path, entries] of incoming) next[path] = [...(next[path] ?? []), ...entries];
      slice.set(withoutEmpty(next));
    },
  });

  return check;
}

/**
 * `check('error', { blocking: true })`: a named check. It adds an option, a state slice and an api member, all named
 * by the check, and registers with `validation`. The check's name is a literal type, so `form.error` is typed.
 * `validation` must be extended before the check.
 */
export const check =
  <const Name extends string>(name: Name, options: Omit<CheckOptions<Name>, 'name'> = {}) =>
  <Values>(form: Extendable<Values, Needs<Values, 'values' | 'validation'>>) =>
    defineExtension(form, {
      name: `check:${name}`,
      options: { [name]: option.value<EventValidators<Values>>() } as Record<
        Name,
        OptionDescriptor<EventValidators<Values>, 'value'>
      >,
      state: () => ({ [name]: {} }) as Record<Name, CheckState>,
      api: (ctx, { values, validation }) =>
        ({ [name]: createCheck(ctx, { values, validation }, { ...options, name }) }) as Record<
          Name,
          CheckApi<Values, Name>
        >,
    });
