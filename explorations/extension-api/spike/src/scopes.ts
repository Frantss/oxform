import type * as Api from './api';
import { getAt } from './paths';

/** `defineForm` calls this key on a scope definition when it merges options, so it never imports this module. A form without scopes pays nothing. */
const MOUNT = Symbol.for('oxform.scope.mount');
/** `defineForm` also calls this key once an instance exists, to check what the scope needs from it. */
const VERIFY = Symbol.for('oxform.scope.verify');

type Options = Record<string, unknown>;
type Part = { readonly validator: Api.CheckValidator<any>; readonly path?: string };
type Composite = Api.CheckValidator<any> & { readonly parts: readonly Part[] };

const EVENTS: readonly Api.ValidationEvent[] = ['change', 'blur', 'focus', 'submit'];

/**
 * A validator that runs several validators and merges their issues. A scope's validator reads the values at its
 * path, and its issue paths are re-prefixed with it. Standard Schema has no composition api, so this wraps
 * schemas without a library-specific `.extend`.
 */
function composite(parts: readonly Part[]): Composite {
  const validator: Api.CheckValidator<any> = store => ({
    '~standard': {
      version: 1,
      vendor: 'oxform',
      async validate(values) {
        const results = await Promise.all(
          parts.map(async ({ validator: part, path }) => {
            const scoped = path === undefined ? store : { ...store, values: getAt(store.values, path) };
            const schema = typeof part === 'function' ? part(scoped as never) : part;
            const result = await schema['~standard'].validate(path === undefined ? values : getAt(values, path));
            return (result.issues ?? []).map(issue =>
              path === undefined ? issue : { ...issue, path: [...path.split('.'), ...(issue.path ?? [])] },
            );
          }),
        );

        const issues = results.flat();
        return issues.length > 0 ? { issues } : { value: values };
      },
    },
  });
  return Object.assign(validator, { parts });
}

const partsOf = (validator: Api.CheckValidator<any> | undefined): Part[] =>
  validator === undefined ? [] : 'parts' in validator ? [...(validator as Composite).parts] : [{ validator }];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Plain objects merge key by key. Anything else, arrays included, is replaced by the later value. */
function deepMerge(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over;
  return Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(over)])].map(key => [key, deepMerge(base[key], over[key])]),
  );
}

/**
 * Places one scope into a form's options. `layers` are the option objects of the form in increasing priority: the
 * ones given to `defineForm`, to `configure` and to `create`. The scope's default values go at its path and merge
 * deeply under the default values of each layer at that path. Its validators join the validators of the form's own
 * check option, per event: both run, and their issues are merged.
 */
function mount(
  scope: Api.ScopeDefinition<any>,
  options: Options,
  mountPath: string,
  layers: readonly Options[],
): Options {
  if (mountPath.includes('.'))
    throw new Error(
      `The scope "${mountPath}" has a dot in its key. A scope is one key: view a nested path with form.scope(path).`,
    );
  const own = layers[0]?.defaultValues as Record<string, unknown> | undefined;
  if (own && mountPath in own)
    throw new Error(`The scope "${mountPath}" has the key of one of the form's own values, which it would replace.`);

  const merged: Options = {
    ...options,
    defaultValues: {
      ...(options.defaultValues as object | undefined),
      [mountPath]: layers.reduce<unknown>(
        (value, layer) => deepMerge(value, (layer.defaultValues as Record<string, unknown> | undefined)?.[mountPath]),
        scope.defaultValues,
      ),
    },
  };

  for (const [name, validators] of Object.entries(scope.checks ?? {})) {
    const current = (merged[name] ?? {}) as Api.EventValidators<any>;
    const next: Record<string, Api.CheckValidator<any>> = { ...current };

    for (const event of EVENTS) {
      const added = validators?.[event];
      if (added) next[event] = composite([...partsOf(current[event]), { validator: added, path: mountPath }]);
    }
    merged[name] = next;
  }

  return merged;
}

/** A scope's validators run on a check, so the instance must have a check of that name. */
function verify(scope: Api.ScopeDefinition<any>, instance: object, mountPath: string) {
  const checks = (instance as { validation?: { checks: readonly { name: string }[] } }).validation?.checks ?? [];
  const available = new Set(checks.map(check => check.name));
  for (const name of Object.keys(scope.checks ?? {}))
    if (!available.has(name))
      throw new Error(`The scope "${mountPath}" has validators for the check "${name}", which the form does not have.`);
}

/** A scope definition is data plus the logic to place it. `defineForm({ scopes })` gives it a path. */
export const defineScope = (<Values>(scope: Api.ScopeDefinition<Values>) => ({
  ...scope,
  [MOUNT]: mount.bind(undefined, scope),
  [VERIFY]: verify.bind(undefined, scope),
})) as unknown as typeof Api.defineScope;
