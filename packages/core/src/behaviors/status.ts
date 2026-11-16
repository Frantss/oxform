import { ancestorsOf, getAt, isDeepEqual, isWithin } from '#internal/paths';
import { contextInternals } from '#main/context';
import { defineExtension, optionTypes } from '#main/form';
import type { Path } from '#main/path-types';
import type { Extendable, FormContext, Needs } from '#main/types';
import type { ValuesApi } from './values';

export interface FieldStatus {
  readonly dirty: boolean;
  readonly pristine: boolean;
  readonly touched: boolean;
  readonly blurred: boolean;
  readonly valid: boolean;
  /** Deep equality with the default value. `dirty` records an interaction and does not clear itself. */
  readonly default: boolean;
}

export interface FormStatus {
  readonly dirty: boolean;
  readonly pristine: boolean;
  readonly touched: boolean;
  readonly blurred: boolean;
  readonly valid: boolean;
  readonly validating: boolean;
  readonly submitting: boolean;
  readonly submits: number;
  readonly submitted: boolean;
  readonly successful: boolean | null;
}

export type FormStatusDefaults = Partial<Pick<FormStatus, 'dirty' | 'submits' | 'successful'>>;
export type FieldStatusDefaults = Partial<Pick<FieldStatus, 'dirty' | 'touched' | 'blurred'>>;

/** The status in the store: the form, and an entry for each node of the values and each marked path. */
export interface StatusState {
  readonly form: FormStatus;
  readonly fields: Readonly<Record<string, FieldStatus>>;
}

export interface StatusApi<Values> {
  /** A snapshot. Subscribe to the store to follow it. */
  readonly form: FormStatus;
  at(path: Path<Values>): FieldStatus;
}

type Interaction = Required<FieldStatusDefaults>;
type FormFlags = { dirty: boolean; submitting: boolean; submits: number; successful: boolean | null };

/** The raw flags. The store holds the derived `StatusState` under the same key. */
type StatusSlice = {
  readonly form: FormFlags;
  readonly fields: Readonly<Record<string, Interaction>>;
  /** Goes up at each whole-form reset, so a submit that started before it can tell. */
  readonly generation: number;
};

type StatusOptions = {
  readonly defaultValues?: unknown;
  readonly defaultStatus?: FormStatusDefaults;
  readonly defaultFieldStatus?: Readonly<Record<string, FieldStatusDefaults | undefined>>;
};

/** The writes of events, arrays, reset and submit. They are not on `StatusApi`. */
export interface StatusInternals {
  /** Sets flags on the path and on each ancestor. */
  mark(path: string, flags: Partial<Interaction>): void;
  setForm(flags: Partial<FormFlags>): void;
  /** Without a path: the whole form, also its flags. With a path: the field flags of that subtree only. */
  reset(options?: {
    readonly path?: string;
    readonly status?: FormStatusDefaults;
    readonly keepFields?: boolean;
  }): void;
  /** Moves the field flags under an array path as the items move. `undefined` drops the flags of an item. */
  remap(path: string, to: (index: number) => number | undefined): void;
  generation(): number;
}

const internals = new WeakMap<object, StatusInternals>();

export const statusInternals = (status: object): StatusInternals => {
  const found = internals.get(status);
  if (!found) throw new TypeError('statusInternals expects a status api made by the status extension.');
  return found;
};

/** What `status` reads of a check through the validation link. */
type LinkedCheck = { readonly blocking: boolean; at(path: string, options: { nested: boolean }): readonly unknown[] };

const formFlagsOf = (options: StatusOptions, override?: FormStatusDefaults): FormFlags => ({
  dirty: false,
  submitting: false,
  submits: 0,
  successful: null,
  ...options.defaultStatus,
  ...override,
});

/** Each node of the values (objects, arrays and leaves), as a dotted path. */
function* nodePaths(value: unknown, prefix = ''): Generator<string> {
  if (typeof value !== 'object' || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    yield path;
    yield* nodePaths(child, path);
  }
}

const sameField = (left: FieldStatus, right: FieldStatus) =>
  (Object.keys(left) as (keyof FieldStatus)[]).every(key => left[key] === right[key]);

/** Derives the status from the raw flags, the values and the checks, and keeps each unchanged entry by reference. */
export const createStatus = <Values>(
  context: FormContext<StatusOptions, { status: StatusSlice }>,
  deps: { readonly values: ValuesApi<Values> },
): StatusApi<Values> => {
  const slice = context.state.status;
  const link = () => contextInternals(context).validation();
  const fieldDefaults = (path: string): Interaction => ({
    dirty: false,
    touched: false,
    blurred: false,
    ...context.options().defaultFieldStatus?.['*'],
    ...context.options().defaultFieldStatus?.[path],
  });
  const flagsOf = (path: string) => slice.get().fields[path] ?? fieldDefaults(path);
  const knownPaths = () => [
    ...new Set([
      ...Object.keys(slice.get().fields),
      ...Object.keys(context.options().defaultFieldStatus ?? {}).filter(path => path !== '*'),
    ]),
  ];
  const blocked = (path: string, nested: boolean) =>
    (link().checks as readonly LinkedCheck[]).some(check => check.blocking && check.at(path, { nested }).length > 0);

  const cache = new Map<string, FieldStatus>();
  const field = (path: string): FieldStatus => {
    const { dirty, touched, blurred } = flagsOf(path);
    const next: FieldStatus = {
      dirty,
      pristine: !dirty,
      touched,
      blurred,
      valid: !blocked(path, false),
      default: isDeepEqual(getAt(deps.values.get(), path), getAt(context.options().defaultValues, path)),
    };
    const cached = cache.get(path);
    if (cached && sameField(cached, next)) return cached;
    cache.set(path, next);
    return next;
  };

  let previous: StatusState | undefined;
  const compute = (): StatusState => {
    const flags = slice.get().form;
    const known = knownPaths();
    const fields: Record<string, FieldStatus> = {};
    for (const path of new Set([...nodePaths(deps.values.get()), ...known])) fields[path] = field(path);
    const marked = known.map(path => fields[path]!);
    const anyDirty = marked.some(status => status.dirty);
    const form: FormStatus = {
      dirty: flags.dirty || anyDirty,
      pristine: !anyDirty,
      touched: marked.some(status => status.touched),
      blurred: marked.some(status => status.blurred),
      valid: !blocked('', true),
      validating: link().validating,
      submitting: flags.submitting,
      submits: flags.submits,
      submitted: flags.submits > 0,
      successful: flags.successful,
    };
    if (previous === undefined) return (previous = { form, fields });

    const sameFields =
      Object.keys(fields).length === Object.keys(previous.fields).length &&
      Object.entries(fields).every(([path, status]) => previous!.fields[path] === status);
    const sameForm = (Object.keys(form) as (keyof FormStatus)[]).every(key => form[key] === previous!.form[key]);
    if (sameFields && sameForm) return previous;
    return (previous = { form: sameForm ? previous.form : form, fields: sameFields ? previous.fields : fields });
  };

  contextInternals(context).derive('status', compute);
  const derived = () => (context.store.state as unknown as { readonly status: StatusState }).status;

  const status: StatusApi<Values> = {
    get form() {
      return derived().form;
    },
    at: path => derived().fields[path] ?? field(path),
  };

  internals.set(status, {
    mark(path, flags) {
      slice.set(state => {
        const fields = { ...state.fields };
        for (const target of [path, ...ancestorsOf(path).filter(ancestor => ancestor !== '')]) {
          fields[target] = { ...(fields[target] ?? fieldDefaults(target)), ...flags };
        }
        return { ...state, fields };
      });
    },
    setForm: flags => slice.set(state => ({ ...state, form: { ...state.form, ...flags } })),
    reset({ path, status: override, keepFields = false } = {}) {
      if (path === undefined || path === '') {
        slice.set(state => ({
          form: formFlagsOf(context.options(), override),
          fields: keepFields ? state.fields : {},
          generation: state.generation + 1,
        }));
        return;
      }
      slice.set(state => ({
        ...state,
        fields: Object.fromEntries(Object.entries(state.fields).filter(([key]) => !isWithin(key, path))),
      }));
    },
    remap(path, to) {
      const prefix = `${path}.`;
      slice.set(state => {
        const fields: Record<string, Interaction> = {};
        for (const [key, flags] of Object.entries(state.fields)) {
          if (!key.startsWith(prefix)) {
            fields[key] = flags;
            continue;
          }
          const [index, ...rest] = key.slice(prefix.length).split('.');
          const moved = to(Number(index));
          if (moved !== undefined) fields[[path, String(moved), ...rest].join('.')] = flags;
        }
        return { ...state, fields };
      });
    },
    generation: () => slice.get().generation,
  });

  return status;
};

/** The field defaults by path, with `'*'` for every path (G8). A path wins over `'*'`. */
export type DefaultFieldStatus<Values> = { readonly [At in Path<Values> | '*']?: FieldStatusDefaults };

/**
 * `status`: dirty, touched, blurred, valid and the flags of the form, derived into `store.state.status`. It needs
 * `values`. It reads `valid` and `validating` through the validation link, so a chain without `validation` finds
 * every path valid.
 *
 * The slice holds the raw flags and the store holds the derived status under the same key. The state is typed as the
 * public `StatusState`, which the store and the slots read, so the behavior gets its raw slice by a cast.
 */
export const status = <Values>(form: Extendable<Values, Needs<Values, 'values'>>) =>
  defineExtension(form, {
    name: 'status',
    needs: { api: ['values'] },
    options: optionTypes<{ defaultStatus: FormStatusDefaults; defaultFieldStatus: DefaultFieldStatus<Values> }>(),
    state: options => ({
      status: { form: formFlagsOf(options), fields: {}, generation: 0 } satisfies StatusSlice as unknown as StatusState,
    }),
    api: (context, { values }) => ({
      status: createStatus<Values>(context as unknown as FormContext<StatusOptions, { status: StatusSlice }>, {
        values,
      }),
    }),
  });
