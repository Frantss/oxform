import { slotsOf } from '@oxform/core/adapter';
import { expect, it } from 'vite-plus/test';
import { signInForm } from './sign-in';

const setup = () => ({ form: signInForm, [Symbol.dispose]() {} });

it('applies the values extension', () => {
  using subject = setup();

  expect(slotsOf(subject.form)).toEqual(['values']);
});
