import { slots, type Form } from '#core';
import {
  arrays,
  check,
  events,
  fieldErrorSlots,
  handles,
  reset,
  resetSlots,
  rootSlots,
  status,
  submit,
  submitSlots,
  validation,
  values,
} from '#core/behaviors';

/**
 * The preset: the nine built-in extensions in order, `handles` last, then the slot groups `rootSlots`,
 * `fieldErrorSlots`, `submitSlots` and `resetSlots`. It needs nothing, because it applies `values` first, and it
 * applies to a form that already has extensions. The `extends {}` bounds are required: an unconstrained type
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
      slots(slot => ({ ...rootSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot), ...resetSlots(slot) })),
    );
