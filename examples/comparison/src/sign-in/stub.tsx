/** The markup of the specification with no behavior. Each case of the suite fails against it. */
export const SignInStub = () => (
  <form aria-label='Sign in' noValidate onSubmit={event => event.preventDefault()}>
    <label>
      Email
      <input name='email' type='email' />
    </label>
    <label>
      Password
      <input name='password' type='password' />
    </label>
    <button type='submit'>Sign in</button>
  </form>
);
