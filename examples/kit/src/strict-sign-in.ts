import { slots } from '@oxform/core';
import { signIn } from './sign-in';
import { strictSubmitSlots } from './strict-submit-slots';

/** E13. The sign-in form with the `submit` slot of the design system in place of the built-in one. */
export const strictSignIn = signIn.extend(slots(slot => strictSubmitSlots(slot)));
