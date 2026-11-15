import { createStore } from '@tanstack/store';
import type { FormContext, StateSlice, Unsubscribe } from './api';

type OptionsListener<Options> = (options: Options, previous: Options) => void;

/** What an extension declared in `fields`: the builder, and the runtime test that stands in for the erased type. */
export interface FieldsDefinition {
  readonly guard?: (value: unknown) => boolean;
  readonly build: (field: any, path: string) => object;
}

/** The adapter-facing half of a context: it sets options, binds the instance, and stops or ends its work. */
export interface ContextControls<Options> {
  /** The form state, with the derived slices computed. */
  readonly store: FormContext<Options>['store'];
  setOptions(next: Options): void;
  bindInstance(instance: unknown): void;
  /**
   * Starts the extension's state slices and returns its context. A key that another extension owns throws. The
   * state keys are the extension's own: a behavior reads the others through its dependencies.
   */
  extensionContext(extension: string, state: Record<string, unknown>): FormContext<Options, any>;
  /** Registers the field members of an extension. Handles built later carry them. */
  addFields(extension: string, fields: FieldsDefinition): void;
  /** Runs the cleanups of the work in progress (timers, requests). The instance stays usable, so it can mount again. */
  unmount(): void;
  /** Unmounts for good: the cleanups are dropped and nothing listens any more. */
  destroy(): void;
}

/**
 * Not on `FormContext`. A behavior registers state that is computed from other slices, such as the status. The
 * store then holds the computed value under the slice's name, so slots and selectors read it as plain state.
 * `decorateField` is for the behavior that builds field handles: it gives a handle the members that extensions
 * declared in `fields`. `path` is relative to the scope the handle is in.
 */
export interface ContextInternals {
  derive(name: string, compute: () => unknown): void;
  decorateField<Handle extends object>(handle: Handle, path: string): Handle;
}

const internals = new WeakMap<object, ContextInternals>();

export function contextInternals(ctx: object): ContextInternals {
  const found = internals.get(ctx);
  if (!found) throw new Error('This behavior needs a context created by createContext.');
  return found;
}

/**
 * Adds the members to a handle. The handle is not spread, because its `state` is a getter that must stay live, so
 * property descriptors are copied. A member cannot redefine one of the handle, or one of another extension.
 */
function addMembers(handle: object, members: object, extension: string, owners: Map<string, string>): object {
  for (const key of Object.keys(members)) {
    const owner = owners.get(key);
    if (key in handle || owner !== undefined)
      throw new Error(
        `The "${extension}" extension cannot redefine the field member "${key}"${owner === undefined ? '' : `, which "${owner}" adds`}.`,
      );
    owners.set(key, extension);
  }

  return Object.defineProperties(
    {},
    { ...Object.getOwnPropertyDescriptors(handle), ...Object.getOwnPropertyDescriptors(members) },
  );
}

export function createContext<Options>(initialOptions: Options): ContextControls<Options> {
  /** Slices are written here. The context's `store` is derived from it. */
  const base = createStore<Record<string, unknown>>({});
  const derivations = new Map<string, () => unknown>();
  // A store with no subscriber derives again on every read, and a new object would make a snapshot look changed to
  // an adapter that subscribes and unsubscribes (strict mode). So an unchanged result keeps its reference.
  let previousDerived: Record<string, unknown> | undefined;
  const store = createStore<Record<string, unknown>>(() => {
    const state = base.state;
    if (derivations.size === 0) return state;

    const derived = { ...state };
    for (const [name, compute] of derivations) derived[name] = compute();

    const unchanged =
      previousDerived !== undefined &&
      Object.keys(derived).length === Object.keys(previousDerived).length &&
      Object.entries(derived).every(([name, value]) => previousDerived![name] === value);
    return unchanged ? previousDerived! : (previousDerived = derived);
  });
  const optionListeners = new Set<OptionsListener<Options>>();
  const cleanups: (() => void)[] = [];
  const stateOwners = new Map<string, string>();
  const fieldDefinitions: { extension: string; definition: FieldsDefinition }[] = [];
  let options = initialOptions;
  let instance: unknown;

  const shared = {
    store: store as unknown as FormContext<Options>['store'],
    options: () => options,
    onOptions(listener: OptionsListener<Options>): Unsubscribe {
      optionListeners.add(listener);
      return () => optionListeners.delete(listener);
    },
    onDestroy(cleanup: () => void) {
      cleanups.push(cleanup);
    },
    instance: <Instance>() => instance as Instance,
  };

  const sliceOf = <Slice>(name: string): StateSlice<Slice> => ({
    get: () => base.state[name] as Slice,
    set(next) {
      base.setState(state => ({
        ...state,
        [name]: typeof next === 'function' ? (next as (current: Slice) => Slice)(state[name] as Slice) : next,
      }));
    },
  });

  const contextInternalsFor: ContextInternals = {
    derive: (name, compute) => void derivations.set(name, compute),
    decorateField(handle, path) {
      let decorated: object = handle;
      const owners = new Map<string, string>();
      for (const { extension, definition } of fieldDefinitions) {
        if (definition.guard && !definition.guard((handle as { get(): unknown }).get())) continue;
        decorated = addMembers(decorated, definition.build(handle, path), extension, owners);
      }
      return decorated as typeof handle;
    },
  };

  const controls: ContextControls<Options> = {
    store: shared.store,
    setOptions(next) {
      const previous = options;
      options = next;
      for (const listener of optionListeners) listener(next, previous);
    },
    bindInstance(next) {
      instance = next;
    },
    extensionContext(extension, state) {
      for (const key of Object.keys(state)) {
        const owner = stateOwners.get(key);
        if (owner !== undefined)
          throw new Error(
            `The "${extension}" extension declares the state key "${key}", which "${owner}" already declares.`,
          );
        stateOwners.set(key, extension);
      }
      base.setState(current => ({ ...current, ...state }));

      const context = {
        ...shared,
        state: Object.fromEntries(Object.keys(state).map(key => [key, sliceOf(key)])),
      } as unknown as FormContext<Options, any>;
      internals.set(context, contextInternalsFor);
      return context;
    },
    addFields: (extension, definition) => void fieldDefinitions.push({ extension, definition }),
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
}
