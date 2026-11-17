import { defineSlots, type SlotFactory } from '@oxform/core';
import { check, type CheckState } from '@oxform/core/behaviors';

/**
 * E14. Advice that must not block: a title over 60 characters is cut in search results, and the writer must still
 * publish. `warnings` is a second check, not blocking, with its own `warning` option.
 */
export const warnings = check('warning');

/** The `fieldWarning` part: the first warning of one field. It needs the state of `warnings`. */
export const warningSlots = defineSlots(
  { name: 'warningSlots', needs: { state: ['warning'] } },
  (slot: SlotFactory<{}, { readonly warning: CheckState }>) => ({
    fieldWarning: slot({
      element: 'p',
      props: { name: 'key' },
      present: (state, part) => (state.warning[part.key] ?? []).length > 0,
      state: (state, part) => ({ messages: (state.warning[part.key] ?? []).map(entry => entry.message) }),
      text: ({ messages }) => messages[0],
      attrs: () => ({ role: 'status' }),
    }),
  }),
);
