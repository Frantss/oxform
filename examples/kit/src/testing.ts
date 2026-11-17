import { slotsOf } from '@oxform/core/adapter';

type SlotFunctions = {
  readonly text?: (state: unknown) => string | undefined;
  readonly present?: (state: unknown, part: object) => boolean;
  readonly state?: (state: unknown, part: object) => unknown;
  readonly attrs?: (state: unknown, part: object) => Readonly<Record<string, unknown>>;
};

/**
 * What an adapter renders for one part, read from its slot in Node: whether it is present, its text and its
 * attributes. The specs of the slot groups use it, so they need no DOM.
 */
export const readPart = (
  form: object,
  instance: { readonly id: string; readonly store: { readonly state: unknown } },
  name: string,
  key = '',
) => {
  const slot = slotsOf(form)[name] as unknown as SlotFunctions;
  const part = { id: instance.id, key, props: {}, api: instance };
  const state = instance.store.state;
  const present = slot.present?.(state, part) ?? true;
  return {
    present,
    text: present ? slot.text?.(slot.state?.(state, part) ?? {}) : undefined,
    attrs: slot.attrs?.(state, part) ?? {},
  };
};
