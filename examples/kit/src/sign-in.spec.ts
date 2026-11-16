import { expect, it } from 'vite-plus/test';
import { signInForm } from './sign-in';

const setup = () => {
  const instance = signInForm.create();

  return Object.assign(instance, { [Symbol.dispose]: () => instance.destroy() });
};

it('creates an instance with an id', () => {
  using instance = setup();

  expect(instance.id).toMatch(/^form-\d+$/u);
});
