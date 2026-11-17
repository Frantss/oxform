import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email('Enter an email address.'),
  password: z.string().min(8, 'The password has at least 8 characters.'),
});

export type SignIn = z.infer<typeof signInSchema>;

export const emptySignIn: SignIn = { email: '', password: '' };
