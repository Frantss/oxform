import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { CheckValidator, CheckValidators, ValidationEvent } from '#behaviors/validation';
import { getAt } from '#internal/paths';

/** `form.create` calls this key of a scope definition when it merges the options, so it never imports this module. */
const MOUNT = Symbol.for('oxform.scope.mount');
/** `form.create` calls this key once the api of every extension exists, to check the check names (rule 4). */
const VERIFY = Symbol.for('oxform.scope.verify');

type Options = Record<string, unknown>;

/** A schema and default values for a sub-object, without a place. `defineForm({ scopes })` gives it one. */
export interface ScopeDefinition<Values> {
  /** It only types `Values`. Nothing validates with it (rule 6). */
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
  /** Validators by check name and event. They run at each path where the scope is placed (rule 3). */
  readonly checks?: Readonly<Record<string, CheckValidators<Values>>>;
}

/** The values that a form gains by placing scopes: `{ billing: Address }`. */
export type ScopedValues<Scopes> = {
  readonly [Path in keyof Scopes]: Scopes[Path] extends ScopeDefinition<infer Values> ? Values : never;
};

const isPlainObject = (value: unknown): value is Options =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Plain objects merge key by key. A later value of another type, an array too, replaces the earlier one. */
const deepMerge = (base: unknown, over: unknown): unknown => {
  if (over === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over;
  const keys = new Set([...Object.keys(base), ...Object.keys(over)]);
  return Object.fromEntries([...keys].map(key => [key, deepMerge(base[key], over[key])]));
};

const events: readonly ValidationEvent[] = ['change', 'blur', 'focus', 'submit'];

/** One validator of a composite: a validator of the form, or of a scope at `path`. */
type Part = { readonly validator: CheckValidator<any>; readonly path?: string };
type Composite = CheckValidator<any> & { readonly parts: readonly Part[] };

/**
 * A validator that runs every part and merges their issues, with nothing deduplicated (rule 3). A part of a scope
 * gets the values at its path, and its issue paths start with that path. Standard Schema has no way to compose
 * schemas, so this wraps them.
 */
const composite = (parts: readonly Part[]): Composite =>
  Object.assign(
    (input: { readonly values: unknown }): StandardSchemaV1 => ({
      '~standard': {
        version: 1,
        vendor: 'oxform',
        validate: async values => {
          const found = await Promise.all(
            parts.map(async ({ validator, path }) => {
              const at = (value: unknown) => (path === undefined ? value : getAt(value, path));
              const schema = typeof validator === 'function' ? validator({ values: at(input.values) }) : validator;
              const result = await schema['~standard'].validate(at(values));
              return (result.issues ?? []).map(issue =>
                path === undefined ? issue : { ...issue, path: [path, ...(issue.path ?? [])] },
              );
            }),
          );
          const issues = found.flat();
          return issues.length > 0 ? { issues } : { value: values };
        },
      },
    }),
    { parts },
  );

const partsOf = (validator: CheckValidator<any> | undefined): readonly Part[] => {
  if (validator === undefined) return [];
  return 'parts' in validator ? (validator as Composite).parts : [{ validator }];
};

/** The validators of the scope join the option of each check, per event, at `path`. */
const withChecks = (scope: ScopeDefinition<unknown>, options: Options, path: string) => {
  const merged: Options = { ...options };
  for (const [name, validators] of Object.entries(scope.checks ?? {})) {
    const current = (merged[name] ?? {}) as CheckValidators<unknown>;
    const next: Record<string, CheckValidator<unknown>> = { ...current };
    for (const event of events) {
      const added = validators[event];
      if (added) next[event] = composite([...partsOf(current[event]), { validator: added, path }]);
    }
    merged[name] = next;
  }
  return merged;
};

const defaultsAt = (layer: Options, path: string) => (layer.defaultValues as Options | undefined)?.[path];

/**
 * Places one scope into the options of an instance. `layers` are the options of `defineForm`, `configure` and
 * `create`, lowest priority first. The default values at the path merge deeply over the scope's own (rule 2).
 */
type Layers = readonly [defined: Options, configured: Options, created: Options];

const mount = (scope: ScopeDefinition<unknown>, options: Options, path: string, layers: Layers) => {
  if (path.includes('.')) {
    throw new Error(
      `The scope "${path}" has a dot in its key. A scope is one key: view a nested path with form.scope(path).`,
    );
  }
  if (defaultsAt(layers[0], path) !== undefined) {
    throw new Error(`The scope "${path}" has the key of one of the form's own values, which it would replace.`);
  }
  const defaults = layers.reduce<unknown>(
    (merged, layer) => deepMerge(merged, defaultsAt(layer, path)),
    scope.defaultValues,
  );
  return withChecks(
    scope,
    { ...options, defaultValues: { ...(options.defaultValues as Options), [path]: defaults } },
    path,
  );
};

/** The validators of a scope run on a check, so the form must have a check of each name (rule 4). */
const verify = (scope: ScopeDefinition<unknown>, api: object, path: string) => {
  const checks = (api as { readonly validation?: { readonly checks: readonly { readonly name: string }[] } }).validation
    ?.checks;
  const names = new Set(checks?.map(check => check.name));
  for (const name of Object.keys(scope.checks ?? {})) {
    if (!names.has(name)) {
      throw new Error(`The scope "${path}" has validators for the check "${name}", which the form does not have.`);
    }
  }
};

/** A scope definition carries the logic that places it, so a form without scopes does not load this module. */
export const defineScope = <Values>(scope: ScopeDefinition<Values>): ScopeDefinition<Values> =>
  Object.assign(
    { ...scope },
    {
      [MOUNT]: mount.bind(undefined, scope as ScopeDefinition<unknown>),
      [VERIFY]: verify.bind(undefined, scope as ScopeDefinition<unknown>),
    },
  );
