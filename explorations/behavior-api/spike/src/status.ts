import type {
  FieldStatus,
  FieldStatusDefaults,
  FormContext,
  FormStatus,
  FormStatusDefaults,
  Path,
  StatusApi,
  StatusState,
  ValidationApi,
  ValuesApi,
} from '../../api';
import { contextInternals } from './context';
import { ancestorsOf, getAt, isDeepEqual, isWithin } from './paths';

type Interaction = Required<FieldStatusDefaults>;
type FormFlags = { dirty: boolean; submitting: boolean; submits: number; successful: boolean | null };
interface StatusSlice {
  readonly form: FormFlags;
  readonly fields: Readonly<Record<string, Interaction>>;
  /** Increments on a whole-form reset, so an attempt that started before it can tell. */
  readonly generation: number;
}

/**
 * The writes that events, arrays, reset and submit need. They are not on `StatusApi`: users and extensions do not
 * see them. Kernel behaviors reach them with `statusInternals(status)`.
 */
export interface StatusInternals {
  /** Sets flags on the path and every ancestor. */
  mark(path: string, flags: Partial<Interaction>): void;
  setForm(flags: Partial<FormFlags>): void;
  /** Without a path: the whole form, including form status. With a path: field state in that subtree only. */
  reset(options?: {
    readonly path?: string;
    readonly status?: FormStatusDefaults;
    /** Keeps field state on a whole-form reset. */
    readonly keepFields?: boolean;
  }): void;
  /** Moves field state under an array path as items move. `undefined` drops the item's state. */
  remap(path: string, to: (index: number) => number | undefined): void;
  generation(): number;
}

const internals = new WeakMap<object, StatusInternals>();

export function statusInternals(status: object): StatusInternals {
  const found = internals.get(status);
  if (!found) throw new Error('This behavior needs a status created by createFieldStatus.');
  return found;
}

type StatusOptions = {
  readonly defaultStatus?: FormStatusDefaults;
  readonly defaultFieldStatus?: Partial<Record<string, FieldStatusDefaults>>;
  readonly defaultValues?: unknown;
};

export function createFieldStatus<Values>(
  ctx: FormContext<StatusOptions | {}>,
  deps: { readonly validation?: ValidationApi<Values>; readonly values?: ValuesApi<Values> },
): StatusApi<Values> {
  const options = () => ctx.options() as StatusOptions;
  const formDefaults = (override?: FormStatusDefaults): FormFlags => ({
    dirty: false,
    submitting: false,
    submits: 0,
    successful: null,
    ...options().defaultStatus,
    ...override,
  });
  const fieldDefaults = (path: string): Interaction => ({
    dirty: false,
    touched: false,
    blurred: false,
    ...options().defaultFieldStatus?.['*'],
    ...options().defaultFieldStatus?.[path],
  });

  const slice = ctx.slice<StatusSlice>('status', { form: formDefaults(), fields: {}, generation: 0 });
  const flagsOf = (path: string) => slice.get().fields[path] ?? fieldDefaults(path);

  const knownPaths = () => [
    ...new Set([
      ...Object.keys(slice.get().fields),
      ...Object.keys(options().defaultFieldStatus ?? {}).filter(path => path !== '*'),
    ]),
  ];

  /** A blocking check has an entry at the path, or below it when `nested`. Read through the public `checks`. */
  const hasBlockingIssues = (path: string, nested: boolean) =>
    (deps.validation?.checks ?? []).some(check => check.blocking && check.at(path as never, { nested }).length > 0);

  // Derived status, memoized per path: a field's status object is reused while its flags and results are unchanged,
  // so a selector on one field sees a stable reference when an unrelated field changes.
  const fieldCache = new Map<string, FieldStatus>();
  let previousFields: Record<string, FieldStatus> = {};
  let previousForm: FormStatus | undefined;

  const sameFields = (a: FieldStatus, b: FieldStatus) =>
    a.dirty === b.dirty &&
    a.touched === b.touched &&
    a.blurred === b.blurred &&
    a.valid === b.valid &&
    a.default === b.default;

  const field = (path: string): FieldStatus => {
    const { dirty, touched, blurred } = flagsOf(path);
    const next: FieldStatus = {
      dirty,
      pristine: !dirty,
      touched,
      blurred,
      valid: !hasBlockingIssues(path, false),
      default: deps.values ? isDeepEqual(deps.values.get(path as never), getAt(options().defaultValues, path)) : true,
    };
    const cached = fieldCache.get(path);
    if (cached && sameFields(cached, next)) return cached;

    fieldCache.set(path, next);
    return next;
  };

  /** Every node of the values (objects, arrays and leaves), as dotted paths. */
  function* nodePaths(value: unknown, prefix = ''): Generator<string> {
    if (typeof value !== 'object' || value === null) return;
    for (const [key, child] of Object.entries(value)) {
      const path = prefix === '' ? key : `${prefix}.${key}`;
      yield path;
      yield* nodePaths(child, path);
    }
  }

  const compute = (): StatusState => {
    const { form } = slice.get();
    const paths = new Set([...(deps.values ? nodePaths(deps.values.get()) : []), ...knownPaths()]);

    const fields: Record<string, FieldStatus> = {};
    for (const path of paths) fields[path] = field(path);

    const interactions = knownPaths().map(path => fields[path]!);
    const anyDirty = interactions.some(flags => flags.dirty);
    const nextForm: FormStatus = {
      dirty: form.dirty || anyDirty,
      pristine: !anyDirty,
      touched: interactions.some(flags => flags.touched),
      blurred: interactions.some(flags => flags.blurred),
      valid: !hasBlockingIssues('', true),
      validating: deps.validation?.validating ?? false,
      submitting: form.submitting,
      submits: form.submits,
      submitted: form.submits > 0,
      successful: form.successful,
    };

    const sameKeys = Object.keys(fields).length === Object.keys(previousFields).length;
    const stableFields = sameKeys && Object.entries(fields).every(([path, value]) => previousFields[path] === value);
    const stableForm =
      previousForm !== undefined &&
      Object.entries(nextForm).every(([key, value]) => previousForm![key as keyof FormStatus] === value);
    if (!stableFields) previousFields = fields;
    if (!stableForm) previousForm = nextForm;

    return { form: previousForm!, fields: previousFields };
  };

  contextInternals(ctx).derive('status', compute);

  const status: StatusApi<Values> = {
    get form(): FormStatus {
      return (ctx.store.state as { status: StatusState }).status.form;
    },
    at: (path: Path<Values>) => (ctx.store.state as { status: StatusState }).status.fields[path] ?? field(path),
  };

  internals.set(status, {
    mark(path, flags) {
      slice.set(state => {
        const fields = { ...state.fields };
        for (const target of [path, ...ancestorsOf(path)])
          fields[target] = { ...(fields[target] ?? fieldDefaults(target)), ...flags };
        return { ...state, fields };
      });
    },
    setForm: flags => slice.set(state => ({ ...state, form: { ...state.form, ...flags } })),
    reset(resetOptions = {}) {
      const { path, status: override, keepFields } = resetOptions;
      if (path === undefined || path === '') {
        slice.set(state => ({
          form: formDefaults(override),
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
          const [index = '', ...rest] = key.slice(prefix.length).split('.');
          const moved = to(Number(index));
          if (moved !== undefined) fields[[path, String(moved), ...rest].join('.')] = flags;
        }
        return { ...state, fields };
      });
    },
    generation: () => slice.get().generation,
  });

  return status;
}
