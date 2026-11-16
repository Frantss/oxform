import { expect, it } from 'vite-plus/test';
import { libraries } from './libraries';

const setup = () => ({ libraries: [...libraries], [Symbol.dispose]() {} });

it('compares Oxform with three form libraries', () => {
  using subject = setup();

  expect(subject.libraries).toEqual(['oxform', 'tanstack-form', 'react-hook-form', 'formisch']);
});
