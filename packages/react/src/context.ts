import { createContext, useContext, type Context } from 'react';
import type { Instance } from '#part-view';

/** One context per form object, so `createParts` and `usePart` find the same instance. */
const contexts = new WeakMap<object, Context<Instance | null>>();

export const contextOf = (form: object) => {
  let context = contexts.get(form);
  if (!context) contexts.set(form, (context = createContext<Instance | null>(null)));
  return context;
};

/** The instance of the nearest `Root` of this form object. */
export const useInstance = (form: object) => {
  const instance = useContext(contextOf(form));
  if (!instance) {
    throw new Error(
      'oxform: call this inside the Root of the same form object. `configure` returns a new form object.',
    );
  }
  return instance;
};
