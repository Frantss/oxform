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

/** The chain of the preset, on a form with no options, so that `extend` can check each option name it adds. */
const chain = <Values, Api extends {}, State extends {}, Slots, Fields>(
  form: Form<Values, Api, {}, State, Slots, Fields>,
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

/** `F` with `Options` added to its options. */
type WithOptions<F, Options> =
  F extends Form<infer Values, infer Api, infer Own, infer State, infer Slots, infer Fields>
    ? Form<Values, Api, Options & Own, State, Slots, Fields>
    : never;

/**
 * The preset: the nine built-in extensions in order, `handles` last, then the slot groups `rootSlots`,
 * `fieldErrorSlots`, `submitSlots` and `resetSlots`. It needs nothing, because it applies `values` first, and it
 * applies to a form that already has extensions. The `extends {}` bounds are required: an unconstrained type
 * parameter does not satisfy `Extendable<V, {}>`. The chain runs without the options of `form`, because a generic
 * `Options` leaves the option-name check of `extend` undecided, and the result adds them back.
 */
export const standard = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) =>
  chain(form as unknown as Form<Values, Api, {}, State, Slots, Fields>) as unknown as WithOptions<
    ReturnType<typeof chain<Values, Api, State, Slots, Fields>>,
    Options
  >;
