import { createStore, type ReadonlyStore } from '@tanstack/store';
import type { Unsubscribe, Updater } from './path-types';

type State = Record<string, unknown>;

type OptionsListener<Options> = (options: Options, previous: Options) => void;

export type StateSlice<Value> = {
  get(): Value;
  set(next: Updater<Value>): void;
};

/** What the `api` of an extension gets. TK-013 makes the public `FormContext` from it. */
export type ExtensionContext<Options> = {
  /** The form state, with the derived slices computed. */
  readonly store: ReadonlyStore<State>;
  options(): Options;
  onOptions(listener: OptionsListener<Options>): Unsubscribe;
  /** The cleanup runs at each unmount and at `destroy()`, and stays registered (D16). */
  onDestroy(cleanup: () => void): void;
  /** The instance. It is available after every `api` has run. */
  instance<Instance>(): Instance;
  /** The extension's own state slices. A behavior reads the others through its needs. */
  readonly state: Readonly<Record<string, StateSlice<unknown>>>;
};

/** The members of the validation api that the other behaviors use (01-public-api.md, 3.1). */
export type ValidationLink = {
  run(
    targets?: string | readonly string[],
    options?: object,
  ): Promise<readonly [valid: boolean, issues: Readonly<Record<string, unknown>>]>;
  onRun(listener: (run: unknown) => void): Unsubscribe;
  issues(path?: string): Readonly<Record<string, unknown>>;
  readonly checks: readonly unknown[];
  readonly validating: boolean;
  /** Discards the pending runs that a write at the path would make stale, also when the write changes nothing. */
  discard(path?: string): void;
};

/** A chain without `validation` acts as a chain with `validation` and no check (D53). */
const noValidation: ValidationLink = Object.freeze({
  run: () => Promise.resolve(Object.freeze([true, Object.freeze({})] as const)),
  onRun: () => () => {},
  issues: () => Object.freeze({}),
  checks: Object.freeze([]),
  validating: false,
  discard: () => {},
});

/** What `on` returns at runtime: the builder, and the guard that stands in for the erased value type. */
export type FieldsDefinition = {
  readonly guard?: (value: unknown) => boolean;
  readonly build: (field: { get(): unknown }, path: string) => object;
};

/** Not on the extension context: the channel that the built-in behaviors share. */
export type ContextInternals = {
  /**
   * Gives a field handle the members that extensions declare in `fields`. `path` is relative to the scope of the
   * handle. A member cannot redefine a member of the handle, or a member of another extension.
   */
  decorateField<Handle extends { get(): unknown }>(handle: Handle, path: string): Handle;
  /** The store holds the computed value under the slice name, so slots and selectors read it as plain state. */
  derive(name: string, compute: () => unknown): void;
  /** The validation api of the instance, or a stand-in with no check when the chain has no `validation`. */
  validation(): ValidationLink;
  /** `validation` registers its api here when its `api` runs. */
  registerValidation(api: ValidationLink): void;
};

/** What `form.create` uses to run an instance. */
export type ContextControls<Options> = {
  readonly store: ReadonlyStore<State>;
  setOptions(next: Options): void;
  bindInstance(instance: unknown): void;
  /** Registers the field members of an extension. The handles built later carry them. */
  addFields(extension: string, fields: FieldsDefinition): void;
  /** Starts the state slices of an extension and returns its context. A key that another extension owns throws. */
  extensionContext(extension: string, state: State): ExtensionContext<Options>;
  /** Runs the cleanups. The instance stays usable, so it can mount again. */
  unmount(): void;
  /** Runs the cleanups, then drops them and the option listeners. Only the creator of the instance calls it. */
  destroy(): void;
};

const internals = new WeakMap<object, ContextInternals>();

export const contextInternals = (context: object): ContextInternals => {
  const found = internals.get(context);
  if (!found) throw new TypeError('This behavior needs a context created by createContext.');
  return found;
};

const isShallowEqual = (left: State, right: State): boolean => {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(key => Object.is(left[key], right[key]));
};

const unbound = Symbol('unbound');

/** The handle with the members added. Descriptors are copied, because a getter of the handle must stay live. */
const withMembers = (handle: object, members: object, extension: string, owners: Map<string, string>): object => {
  for (const key of Object.keys(members)) {
    const owner = owners.get(key);
    if (key in handle) {
      const which = owner === undefined ? '' : `, which "${owner}" adds`;
      throw new Error(`The "${extension}" extension cannot redefine the field member "${key}"${which}.`);
    }
    owners.set(key, extension);
  }
  return Object.defineProperties(
    {},
    { ...Object.getOwnPropertyDescriptors(handle), ...Object.getOwnPropertyDescriptors(members) },
  );
};

export const createContext = <Options>(initialOptions: Options): ContextControls<Options> => {
  /** The slices are written here. The store of the context derives from it. */
  const base = createStore<State>({});
  const derivations = new Map<string, () => unknown>();
  // A store with no subscriber derives again at each read. An unchanged result keeps its reference, so a snapshot
  // does not look changed to an adapter that subscribes and unsubscribes.
  let previous: State | undefined;
  const store = createStore<State>(() => {
    if (derivations.size === 0) return base.state;
    const next = { ...base.state };
    for (const [name, compute] of derivations) next[name] = compute();
    if (previous === undefined || !isShallowEqual(previous, next)) previous = next;
    return previous;
  });

  const optionListeners = new Set<OptionsListener<Options>>();
  const cleanups: (() => void)[] = [];
  const stateOwners = new Map<string, string>();
  let options = initialOptions;
  let instance: unknown = unbound;
  let validation = noValidation;
  const fieldDefinitions: { readonly extension: string; readonly fields: FieldsDefinition }[] = [];

  const sliceOf = (name: string): StateSlice<unknown> => ({
    get: () => base.state[name],
    set: next =>
      base.setState(state => ({
        ...state,
        [name]: typeof next === 'function' ? (next as (current: unknown) => unknown)(state[name]) : next,
      })),
  });

  const sharedInternals: ContextInternals = {
    decorateField(handle, path) {
      let decorated: object = handle;
      const owners = new Map<string, string>();
      for (const { extension, fields } of fieldDefinitions) {
        if (fields.guard && !fields.guard(handle.get())) continue;
        decorated = withMembers(decorated, fields.build(handle, path), extension, owners);
      }
      return decorated as typeof handle;
    },
    derive: (name, compute) => void derivations.set(name, compute),
    validation: () => validation,
    registerValidation: api => void (validation = api),
  };

  const controls: ContextControls<Options> = {
    store,
    setOptions(next) {
      const before = options;
      options = next;
      for (const listener of optionListeners) listener(next, before);
    },
    bindInstance(next) {
      instance = next;
    },
    addFields: (extension, fields) => void fieldDefinitions.push({ extension, fields }),
    extensionContext(extension, state) {
      for (const key of Object.keys(state)) {
        const owner = stateOwners.get(key);
        if (owner !== undefined) {
          throw new Error(
            `The "${extension}" extension declares the state key "${key}", which "${owner}" already declares.`,
          );
        }
        stateOwners.set(key, extension);
      }
      base.setState(current => ({ ...current, ...state }));

      const context: ExtensionContext<Options> = {
        store,
        options: () => options,
        onOptions(listener) {
          optionListeners.add(listener);
          return () => void optionListeners.delete(listener);
        },
        onDestroy: cleanup => void cleanups.push(cleanup),
        instance<Instance>() {
          if (instance === unbound) throw new Error('The instance is available after every extension api has run.');
          return instance as Instance;
        },
        state: Object.fromEntries(Object.keys(state).map(key => [key, sliceOf(key)])),
      };
      internals.set(context, sharedInternals);
      return context;
    },
    unmount() {
      for (const cleanup of cleanups) cleanup();
    },
    destroy() {
      controls.unmount();
      cleanups.length = 0;
      optionListeners.clear();
    },
  };

  return controls;
};
