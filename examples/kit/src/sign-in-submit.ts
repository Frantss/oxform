import type { InstanceOf } from '@oxform/core';
import type { SignIn } from './schemas/sign-in';
import { auth } from './services';
import type { signIn } from './sign-in';

/**
 * E19. The server refuses a password. `onSubmit` awaits the request and sets an error on `password`, so the form
 * shows it and stays usable. The submit part shows `submitting` until the request ends.
 */
export const submitSignIn = async (credentials: SignIn, form: InstanceOf<typeof signIn>) => {
  if (!(await auth.signIn(credentials)))
    form.error.set('password', [{ message: 'The email or the password is wrong.' }]);
};
