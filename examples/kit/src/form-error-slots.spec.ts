import { slots } from '@oxform/core';
import { describe, expect, it } from 'vite-plus/test';
import { formErrorSlots } from './form-error-slots';
import { signIn } from './sign-in';
import { readPart } from './testing';

/** Sign-in with the `formError` part. */
const form = signIn.extend(slots(slot => formErrorSlots(slot)));

const setup = () => {
  const instance = form.create({ onSubmit: () => {} });
  const formError = () => readPart(form, instance, 'formError');
  return { instance, formError, [Symbol.dispose]: () => instance.destroy() };
};

describe('formErrorSlots', () => {
  it('is absent before a submit', () => {
    using subject = setup();

    expect(subject.formError().present).toBe(false);
  });

  it('shows its message as an alert after a failed submit', async () => {
    using subject = setup();
    await subject.instance.submit.run();

    expect(subject.formError()).toEqual({
      present: true,
      text: 'The form was not sent. Correct the marked fields, then try again.',
      attrs: { role: 'alert' },
    });
  });

  it('goes after a successful submit', async () => {
    using subject = setup();
    await subject.instance.submit.run();
    subject.instance.values.set('email', 'ada@example.com');
    subject.instance.values.set('password', 'analytical');
    await subject.instance.submit.run();

    expect(subject.formError().present).toBe(false);
  });
});
