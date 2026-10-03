import { requireOwner } from '#internal/require-owner';
import { resolve } from '#internal/resolve';
import type { MaybeAccessor } from '#types/maybe-accessor';
import type { AnyFormApi } from 'oxform-core';
import { createMemo, onCleanup, untrack } from 'solid-js';

type BindingOptions = { form: AnyFormApi; name: string };
type BindingApi = { options: BindingOptions; '~mount': () => () => void };

export const createBinding = <Options extends BindingOptions, Api extends BindingApi>(
  options: MaybeAccessor<Options>,
  factory: (options: Options) => Api,
): Api => {
  requireOwner();
  const current = createMemo(
    () => {
      const nextOptions = resolve(options);
      const form = nextOptions.form;
      const name = nextOptions.name;
      return untrack(() => {
        const api = factory({ ...nextOptions, form, name });
        onCleanup(api['~mount']());
        return api;
      });
    },
    { transparent: true },
  );
  const initial = untrack(current);

  const methods = new Map<PropertyKey, (...args: unknown[]) => unknown>();
  return new Proxy(initial, {
    get(_target, key) {
      const value: unknown = Reflect.get(initial, key, initial);
      if (typeof value !== 'function') {
        const api = current();
        return Reflect.get(api, key, api);
      }
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
