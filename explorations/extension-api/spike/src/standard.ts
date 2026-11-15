import type { Form } from './api';
import { arrays } from './arrays';
import { check } from './check';
import { events } from './events';
import { handles } from './handles';
import { reset } from './reset';
import { fieldErrorSlots, fieldSlots, resetSlots, rootSlots, submitSlots } from './slots';
import { slots } from './form';
import { status } from './status';
import { submit } from './submit';
import { validation } from './validation';
import { values } from './values';

/**
 * The preset: a function from form to form, so `form.extend(standard)` applies it. It is built only from the kernel's
 * extensions, each of which also works alone for a lean form. Each one's needs are checked against the ones before
 * it, and hooks registered through `values.intercept`, `submit.intercept` and similar run in this order.
 *
 * The last step adds slots and no api, so it is `slots(...)`: `slot` is typed by the form so far. The generic
 * parameters only carry the form's types through. The `extends {}` bounds are required: an unconstrained type
 * parameter does not satisfy `Extendable<V, {}>`.
 */
export const standard = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) =>
  form
    .extend(values)
    .extend(validation)
    .extend(check('error', { blocking: true, exclusive: true }))
    .extend(status)
    .extend(events)
    .extend(arrays)
    .extend(reset)
    .extend(submit)
    .extend(handles)
    .extend(
      slots(slot => ({
        ...rootSlots(slot),
        ...fieldSlots(slot),
        ...fieldErrorSlots(slot),
        ...submitSlots(slot),
        ...resetSlots(slot),
      })),
    );
