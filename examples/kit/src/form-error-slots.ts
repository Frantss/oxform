import { defineSlots, type SlotFactory } from '@oxform/core';
import type { StatusState } from '@oxform/core/behaviors';

/** E12. Every form needs the same message after a failed submit. The `formError` part is present only then. */
export const formErrorSlots = defineSlots(
  { name: 'formErrorSlots', needs: { state: ['status'] } },
  (slot: SlotFactory<{}, { readonly status: StatusState }>) => ({
    formError: slot({
      element: 'p',
      present: state => state.status.form.submits > 0 && !state.status.form.submitting && !state.status.form.successful,
      text: () => 'The form was not sent. Correct the marked fields, then try again.',
      attrs: () => ({ role: 'alert' }),
    }),
  }),
);
