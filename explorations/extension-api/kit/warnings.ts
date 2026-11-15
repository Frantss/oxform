import type { Form, Needs } from '../spike/src/api';
import { check } from '../spike/src/check';
import { slots } from '../spike/src/form';

/**
 * Advice that does not stop a submit. Adds a `warning` check, a `warning` option with the validators of each event,
 * and a `fieldWarning` slot that shows the messages of one field. A preset: `form.extend(warnings)`.
 */
export const warnings = <
  Values,
  Api extends Needs<Values, 'values' | 'validation'>,
  Options,
  State extends {},
  Slots,
  Fields,
>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) =>
  form.extend(check('warning')).extend(
    slots(slot => ({
      fieldWarning: slot({
        element: 'p',
        props: { name: 'key' },
        text: ({ messages }) => messages[0],
        present: (state, part) => (state.warning[part.key] ?? []).length > 0,
        state: (state, part) => ({ messages: (state.warning[part.key] ?? []).map(entry => entry.message) }),
        attrs: () => ({ role: 'status', className: 'warning' }),
      }),
    })),
  );
