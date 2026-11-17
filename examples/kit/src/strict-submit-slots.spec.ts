import { slots } from '@oxform/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { signIn } from './sign-in';
import { strictSubmitSlots } from './strict-submit-slots';
import { readPart } from './testing';

/** Sign-in with the `submit` slot of the design system in place of the built-in one. */
const form = signIn.extend(slots(slot => strictSubmitSlots(slot)));

const setup = (options: Parameters<typeof form.create>[0] = {}) => {
  const instance = form.create({ onSubmit: () => {}, ...options });
  const disabled = () => readPart(form, instance, 'submit').attrs.disabled;
  return { instance, disabled, [Symbol.dispose]: () => instance.destroy() };
};

describe('strictSubmitSlots', () => {
  it('is enabled on a new form', () => {
    using subject = setup();

    expect(subject.disabled()).toBeUndefined();
  });

  it('is disabled while the form is invalid, and enabled again once it is valid', async () => {
    using subject = setup();
    await subject.instance.submit.run();
    const invalid = subject.disabled();
    subject.instance.values.set('email', 'ada@example.com');
    subject.instance.values.set('password', 'analytical');
    await subject.instance.validation.run();

    expect([invalid, subject.disabled()]).toEqual([true, undefined]);
  });

  it('is disabled while submitting', async () => {
    let finish: (() => void) | undefined;
    using subject = setup({
      defaultValues: { email: 'ada@example.com', password: 'analytical' },
      onSubmit: () => new Promise<void>(resolve => (finish = resolve)),
    });
    const run = subject.instance.submit.run();
    await vi.waitFor(() => expect(finish).toBeDefined());
    const during = subject.disabled();
    finish?.();
    await run;

    expect([during, subject.disabled()]).toEqual([true, undefined]);
  });
});
