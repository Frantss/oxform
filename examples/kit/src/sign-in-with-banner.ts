import { slots } from '@oxform/core';
import { formErrorSlots } from './form-error-slots';
import { signIn } from './sign-in';

/** E12. The sign-in form with the `formError` part. */
export const signInWithBanner = signIn.extend(slots(slot => formErrorSlots(slot)));
