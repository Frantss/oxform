import { describe, expect, it, vi } from 'vite-plus/test';
import { auth } from './services';
import { handleSignIn } from './sign-in-handler';

/** What the page shows: the email and the first error of each field. */
const page = (form: Parameters<Parameters<typeof handleSignIn>[1]>[0]) => ({
  email: form.values.get('email'),
  email_error: form.error.at('email')[0]?.message,
  password_error: form.error.at('password')[0]?.message,
});

const setup = () => ({ [Symbol.dispose]: () => vi.restoreAllMocks() });

describe('handleSignIn', () => {
  it('renders the posted values with their errors', async () => {
    using _subject = setup();

    expect(await handleSignIn({ email: 'ada', password: '' }, page)).toEqual({
      email: 'ada',
      email_error: 'Enter an email address.',
      password_error: 'The password has at least 8 characters.',
    });
  });

  it('shares nothing between two requests that run at the same time', async () => {
    using _subject = setup();
    const answers: ((accepted: boolean) => void)[] = [];
    vi.spyOn(auth, 'signIn').mockImplementation(() => new Promise(resolve => answers.push(resolve)));
    const first = handleSignIn({ email: 'ada@example.com', password: 'wrong password' }, page);
    const second = handleSignIn({ email: 'grace@example.com', password: 'cobol-1959' }, page);
    await vi.waitFor(() => expect(answers).toHaveLength(2));
    answers[1]!(true);
    answers[0]!(false);

    expect(await Promise.all([first, second])).toEqual([
      { email: 'ada@example.com', email_error: undefined, password_error: 'The email or the password is wrong.' },
      { email: 'grace@example.com', email_error: undefined, password_error: undefined },
    ]);
  });
});
