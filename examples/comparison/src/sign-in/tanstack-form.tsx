import { revalidateLogic, useForm } from '@tanstack/react-form';
import { server } from '../server';
import { emptySignIn, refusedMessage, signInSchema } from './schema';

const messageOf = (errors: readonly unknown[]) => {
  const [first] = errors;
  return typeof first === 'string' ? first : (first as { message?: string } | undefined)?.message;
};

export const SignIn = () => {
  const form = useForm({
    defaultValues: emptySignIn,
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    validators: {
      onDynamic: signInSchema,
      // The server answers in a validator of the submit, as "Setting field-level errors from the form's validators".
      onSubmitAsync: async ({ value }) =>
        (await server.signIn(value)) ? undefined : { fields: { password: refusedMessage } },
    },
  });

  return (
    <form
      aria-label='Sign in'
      noValidate
      onSubmit={event => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {(['email', 'password'] as const).map(name => (
        <form.Field key={name} name={name}>
          {field => {
            const message = messageOf(field.state.meta.errors);
            return (
              <>
                <label>
                  {name === 'email' ? 'Email' : 'Password'}
                  <input
                    type={name}
                    name={name}
                    value={field.state.value}
                    aria-describedby={message ? `${name}-error` : undefined}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </label>
                {message && <p id={`${name}-error`}>{message}</p>}
              </>
            );
          }}
        </form.Field>
      ))}
      <form.Subscribe selector={state => state.isSubmitting}>
        {submitting => (
          <button type='submit' disabled={submitting}>
            Sign in
          </button>
        )}
      </form.Subscribe>
    </form>
  );
};
