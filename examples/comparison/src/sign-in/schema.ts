import * as v from 'valibot';

/** The rules of the sign-in form. Every version imports this module. */
export const signInSchema = v.object({
  email: v.pipe(v.string(), v.email('Enter an email address.')),
  password: v.pipe(v.string(), v.minLength(8, 'The password has at least 8 characters.')),
});

export type SignIn = v.InferOutput<typeof signInSchema>;

export const emptySignIn: SignIn = { email: '', password: '' };

/** The message on `password` when the server refuses the credentials. */
export const refusedMessage = 'The email or the password is wrong.';
