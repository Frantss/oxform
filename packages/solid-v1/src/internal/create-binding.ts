import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { AnyFormApi } from '@oxform/core';
import { createComputed, createSignal, onCleanup, untrack } from 'solid-js';

type BindingOptions = { form: AnyFormApi; name: string };
type BindingApi = { options: BindingOptions; '~mount': () => () => void };

export const createBinding = <Options extends BindingOptions, Api extends BindingApi>(
  options: MaybeAccessor<Options>,
  factory: (options: Options) => Api,
): Api => {
  requireOwner();
  const initial = untrack(() => factory({ ...resolve(options) }));
  const [current, setCurrent] = createSignal(initial);
  let cleanup = initial['~mount']();

  createComputed(() => {
    const nextOptions = resolve(options);
    const form = nextOptions.form;
    const name = nextOptions.name;
    untrack(() => {
      const previous = current();
      if (previous.options.form === form && previous.options.name === name) return;
      const next = factory({ ...nextOptions, form, name });
      cleanup();
      cleanup = next['~mount']();
      setCurrent(() => next);
    });
  });
  onCleanup(() => cleanup());

  const methods = new Map<PropertyKey, (...args: unknown[]) => unknown>();
  return new Proxy(initial, {
    get(_target, key) {
      const api = current();
      const value: unknown = Reflect.get(api, key, api);
      if (typeof value !== 'function') return value;
      if (!methods.has(key)) {
        methods.set(key, (...args) =>
          untrack(() => {
            const target = current();
            return Reflect.apply(Reflect.get(target, key, target) as (...args: unknown[]) => unknown, target, args);
          }),
        );
      }
      return methods.get(key);
    },
  });
};
