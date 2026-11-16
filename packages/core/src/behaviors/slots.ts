import { defineSlots } from '#main/form';
import type { SlotFactory } from '#main/types';

/** A placeholder until TK-028: the `root` part as a form element. */
export const rootSlots = /* @__PURE__ */ defineSlots({ name: 'rootSlots' }, (slot: SlotFactory<{}, {}>) => ({
  root: slot({ element: 'form' }),
}));
