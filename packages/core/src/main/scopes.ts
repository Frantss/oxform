import type { StandardSchemaV1 } from '@standard-schema/spec';

/** `form.create` calls this key of a scope definition when it merges the options, so it never imports this module. */
const MOUNT = Symbol.for('oxform.scope.mount');

type Options = Record<string, unknown>;

/** A schema and default values for a sub-object, without a place. `defineForm({ scopes })` gives it one. */
export interface ScopeDefinition<Values> {
  /** It only types `Values`. Nothing validates with it (rule 6). */
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
}

/** The values that a form gains by placing scopes: `{ billing: Address }`. */
export type ScopedValues<Scopes> = {
  readonly [Path in keyof Scopes]: Scopes[Path] extends ScopeDefinition<infer Values> ? Values : never;
};

const isPlainObject = (value: unknown): value is Options =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Plain objects merge key by key. A later value of another kind, an array too, replaces the earlier one. */
const deepMerge = (base: unknown, over: unknown): unknown => {
  if (over === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over;
  const keys = new Set([...Object.keys(base), ...Object.keys(over)]);
  return Object.fromEntries([...keys].map(key => [key, deepMerge(base[key], over[key])]));
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
  return { ...options, defaultValues: { ...(options.defaultValues as Options), [path]: defaults } };
};

/** A scope definition carries the logic that places it, so a form without scopes does not load this module. */
export const defineScope = <Values>(scope: ScopeDefinition<Values>): ScopeDefinition<Values> =>
  Object.assign({ ...scope }, { [MOUNT]: mount.bind(undefined, scope as ScopeDefinition<unknown>) });
