import { valibotResolver } from '@hookform/resolvers/valibot';
import { useForm } from 'react-hook-form';
import { server } from '../server';
import { emptySignIn, refusedMessage, signInSchema, type SignIn as Credentials } from './schema';

export const SignIn = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: valibotResolver(signInSchema),
    defaultValues: emptySignIn,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  return (
    <form
      aria-label='Sign in'
      noValidate
      onSubmit={handleSubmit(async credentials => {
        if (!(await server.signIn(credentials))) setError('password', { message: refusedMessage });
      })}
    >
      <label>
        Email
        <input type='email' aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />
      </label>
      {errors.email && <p id='email-error'>{errors.email.message}</p>}
      <label>
        Password
        <input
          type='password'
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
      </label>
      {errors.password && <p id='password-error'>{errors.password.message}</p>}
      <button type='submit' disabled={isSubmitting}>
        Sign in
      </button>
    </form>
  );
};
