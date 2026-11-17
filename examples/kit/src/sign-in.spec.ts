import { describe, expect, it, vi } from 'vite-plus/test';
import { signIn } from './sign-in';

const setup = () => {
  const onSubmit = vi.fn();
  const form = signIn.create({ onSubmit });
  return { form, onSubmit, [Symbol.dispose]: () => form.destroy() };
};

describe('signIn', () => {
  it('refuses an empty submit, and gives each field its message', async () => {
    using subject = setup();
    await subject.form.submit.run();

    expect([subject.onSubmit.mock.calls.length, subject.form.error.at('email')[0]?.message, subject.form.error.at('password')[0]?.message]).toEqual([
      0,
      'Enter an email address.',
      'The password has at least 8 characters.',
    ]);
  });

  it('submits valid values', async () => {
    using subject = setup();
    subject.form.values.set('email', 'ada@example.com');
    subject.form.values.set('password', 'analytical');
    await subject.form.submit.run();

    expect(subject.onSubmit.mock.calls[0]?.[0]).toEqual({ email: 'ada@example.com', password: 'analytical' });
  });

  it('validates a field on blur', async () => {
    using subject = setup();
    subject.form.values.set('email', 'ada');
    subject.form.events.blur('email');
    await vi.waitFor(() => expect(subject.form.error.at('email')).toHaveLength(1));
  });
});
