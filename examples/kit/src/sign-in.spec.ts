import { slotsOf } from '@oxform/core/adapter';
import { expect, it } from 'vite-plus/test';
import { signInForm } from './sign-in';

it('applies the values extension', () => {
  expect(slotsOf(signInForm)).toEqual(['values']);
});
