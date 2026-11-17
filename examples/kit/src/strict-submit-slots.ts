import { defineSlots, type SlotFactory } from '@oxform/core';
import type { StatusState } from '@oxform/core/behaviors';

/**
 * E13. The design system disables the submit button until the form is valid, and the built-in part does not. A
 * child function cannot change the attributes of a part, so this group replaces the `submit` slot: spread after
 * `submitSlots`, its key wins.
 */
export const strictSubmitSlots = defineSlots(
  { name: 'strictSubmitSlots', needs: { state: ['status'] } },
  (slot: SlotFactory<{}, { readonly status: StatusState }>) => ({
    submit: slot({
      element: 'button',
      state: state => ({ submitting: state.status.form.submitting }),
      attrs: state => ({
        type: 'submit',
        disabled: state.status.form.submitting || !state.status.form.valid || undefined,
        'data-submitting': state.status.form.submitting ? '' : undefined,
      }),
    }),
  }),
);
