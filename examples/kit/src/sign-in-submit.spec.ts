import { describe, expect, it, vi } from 'vite-plus/test';
import { auth } from './services';
import { signIn } from './sign-in';
import { submitSignIn } from './sign-in-submit';

const setup = (password: string) => {
  const form = signIn.create({ defaultValues: { email: 'ada@example.com', password }, onSubmit: submitSignIn });
  return {
    form,
    [Symbol.dispose]: () => {
      form.destroy();
      vi.restoreAllMocks();
    },
  };
};

describe('submitSignIn', () => {
  it('shows the refusal of the server on the password, and the form stays usable', async () => {
    using subject = setup('wrong password');
    await subject.form.submit.run();
    const refused = subject.form.error.at('password')[0]?.message;
    subject.form.values.set('password', 'analytical');
    await subject.form.submit.run();

    expect([refused, subject.form.error.at('password')]).toEqual(['The email or the password is wrong.', []]);
  });

  it('is submitting until the server answers', async () => {
    using subject = setup('analytical');
    let answer: (accepted: boolean) => void = () => {};
    const request = vi.spyOn(auth, 'signIn').mockImplementationOnce(() => new Promise(resolve => (answer = resolve)));
    const run = subject.form.submit.run();
    await vi.waitFor(() => expect(request).toHaveBeenCalled());
    const during = subject.form.status.form.submitting;
    answer(true);
    await run;

    expect([during, subject.form.status.form.submitting]).toEqual([true, false]);
  });
});
