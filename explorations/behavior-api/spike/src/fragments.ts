import type * as Api from '../../api';
import { getAt } from './paths';

/** `configureForm` calls this key on a mounted fragment, so it never imports this module. A form without fragments pays nothing. */
const MOUNT = Symbol.for('oxform.fragment.mount');

type Options = Record<string, unknown>;
type Part = { readonly validator: Api.CheckValidator<any>; readonly mount?: string };
type Composite = Api.CheckValidator<any> & { readonly parts: readonly Part[] };

const EVENTS: readonly Api.ValidationEvent[] = ['change', 'blur', 'focus', 'submit'];

/**
 * A validator that runs several validators and merges their issues. A fragment's validator reads the values at its
 * mount, and its issue paths are re-prefixed with the mount. Standard Schema has no composition api, so this wraps
 * schemas without a library-specific `.extend`.
 */
function composite(parts: readonly Part[]): Composite {
  const validator: Api.CheckValidator<any> = store => ({
    '~standard': {
      version: 1,
      vendor: 'oxform',
      async validate(values) {
        const results = await Promise.all(
          parts.map(async ({ validator: part, mount }) => {
            const scoped = mount === undefined ? store : { ...store, values: getAt(store.values, mount) };
            const schema = typeof part === 'function' ? part(scoped as never) : part;
            const result = await schema['~standard'].validate(mount === undefined ? values : getAt(values, mount));
            return (result.issues ?? []).map(issue =>
              mount === undefined ? issue : { ...issue, path: [...mount.split('.'), ...(issue.path ?? [])] },
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

/**
 * Mounts one fragment into a form's options. Its default values go at the mount, and its validators join the
 * validators of the form's own check option, per event. Explicit `defaultValues` win over a mount's.
 */
function mount(fragment: Api.FragmentDefinition<any>, options: Options, mountPath: string): Options {
  const merged: Options = {
    ...options,
    defaultValues: { [mountPath]: fragment.defaultValues, ...(options.defaultValues as object | undefined) },
  };

  for (const [name, validators] of Object.entries(fragment.checks ?? {})) {
    const current = (merged[name] ?? {}) as Api.EventValidators<any>;
    const next: Record<string, Api.CheckValidator<any>> = { ...current };

    for (const event of EVENTS) {
      const added = validators?.[event];
      if (added) next[event] = composite([...partsOf(current[event]), { validator: added, mount: mountPath }]);
    }
    merged[name] = next;
  }

  return merged;
}

/** A fragment is data plus the logic to mount it. Mounting gives it a place in `configureForm`. */
export const defineFragment = (<Values>(fragment: Api.FragmentDefinition<Values>) => ({
  ...fragment,
  [MOUNT]: mount.bind(undefined, fragment),
})) as unknown as typeof Api.defineFragment;
