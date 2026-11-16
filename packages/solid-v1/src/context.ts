import { slotsOf } from '@oxform/core/adapter';
import { createContext, useContext, type Context } from 'solid-js';
import type { Instance, SlotDefinition } from '#part-view';

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

/** The slots of each form object. `slotsOf` builds them on each call, and a part needs the same slot each time. */
const slotCache = new WeakMap<object, Readonly<Record<string, SlotDefinition>>>();

export const slotsOfForm = (form: object) => {
  let slots = slotCache.get(form);
  if (!slots) slotCache.set(form, (slots = slotsOf(form) as unknown as Readonly<Record<string, SlotDefinition>>));
  return slots;
};
