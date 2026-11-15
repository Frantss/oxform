import type { Form } from '../spike/src/api';
import { check } from '../spike/src/check';
import { events } from '../spike/src/events';
import { slots } from '../spike/src/form';
import { fieldErrorSlots, fieldSlots, submitSlots } from '../spike/src/slots';
import { status } from '../spike/src/status';
import { submit } from '../spike/src/submit';
import { validation } from '../spike/src/validation';
import { values } from '../spike/src/values';

/**
 * A form with only what a short embedded form needs: no arrays, no reset, no field handles. A preset:
 * `defineForm({ schema, defaultValues }).extend(leanForm)`. Its types are inferred from the chain.
 */
export const leanForm = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) =>
  form
    .extend(values)
    .extend(validation)
    .extend(check('error', { blocking: true, exclusive: true }))
    .extend(status)
    .extend(events)
    .extend(submit)
    .extend(
      slots(slot => ({
        root: slot({
          element: 'form',
          on: {
            submit: (event, { api }) => {
              event.preventDefault();
              void api.submit.run();
            },
          },
        }),
        ...fieldSlots(slot),
        ...fieldErrorSlots(slot),
        ...submitSlots(slot),
      })),
    );
