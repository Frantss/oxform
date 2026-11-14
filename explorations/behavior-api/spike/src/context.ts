import { createStore } from '@tanstack/store';
import type { FormContext, StateSlice, Unsubscribe } from '../../api';

type OptionsListener<Options> = (options: Options, previous: Options) => void;

/** The adapter-facing half of a context: it sets options, binds the instance, and stops or ends its work. */
export interface ContextControls<Options> {
  setOptions(next: Options): void;
  bindInstance(instance: unknown): void;
  /** Runs the cleanups of the work in progress (timers, requests). The instance stays usable, so it can mount again. */
  unmount(): void;
  /** Unmounts for good: the cleanups are dropped and nothing listens any more. */
  destroy(): void;
}

/**
 * Not on `FormContext`. A behavior registers state that is computed from other slices, such as the status. The
 * store then holds the computed value under the slice's name, so slots and selectors read it as plain state.
 */
export interface ContextInternals {
  derive(name: string, compute: () => unknown): void;
}

const internals = new WeakMap<object, ContextInternals>();

export function contextInternals(ctx: object): ContextInternals {
  const found = internals.get(ctx);
  if (!found) throw new Error('This behavior needs a context created by createContext.');
  return found;
}

export function createContext<Options>(initialOptions: Options): [FormContext<Options>, ContextControls<Options>] {
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
  let options = initialOptions;
  let instance: unknown;

  const context: FormContext<Options> = {
    store: store as unknown as FormContext<Options>['store'],
    options: () => options,
    onOptions(listener): Unsubscribe {
      optionListeners.add(listener);
      return () => optionListeners.delete(listener);
    },
    onDestroy(cleanup) {
      cleanups.push(cleanup);
    },
    instance: <Instance>() => instance as Instance,
    slice<Slice>(name: string, initial: Slice): StateSlice<Slice> {
      base.setState(state => ({ ...state, [name]: initial }));
      return {
        get: () => base.state[name] as Slice,
        set(next) {
          base.setState(state => ({
            ...state,
            [name]: typeof next === 'function' ? (next as (current: Slice) => Slice)(state[name] as Slice) : next,
          }));
        },
      };
    },
  };

  internals.set(context, { derive: (name, compute) => void derivations.set(name, compute) });

  const controls: ContextControls<Options> = {
    setOptions(next) {
      const previous = options;
      options = next;
      for (const listener of optionListeners) listener(next, previous);
    },
    bindInstance(next) {
      instance = next;
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

  return [context, controls];
}
