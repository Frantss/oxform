import { defineForm, slots } from '@oxform/core';
import {
  check,
  events,
  fieldErrorSlots,
  rootSlots,
  status,
  submit,
  submitSlots,
  validation,
  values,
} from '@oxform/core/behaviors';
import { emptySignIn, signInSchema } from './schemas/sign-in';

/**
 * E01. A sign-in form on a public page: each extension answers a need of the form, and it has no arrays, no
 * reset and no field handles. The slot groups get what they need from the chain.
 */
export const signIn = defineForm({ schema: signInSchema, defaultValues: emptySignIn })
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }))
  .extend(status)
  .extend(events)
  .extend(submit)
  .extend(slots(slot => ({ ...rootSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot) })))
  .configure({ error: { blur: signInSchema, submit: signInSchema } });
