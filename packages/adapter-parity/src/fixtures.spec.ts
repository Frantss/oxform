import { slotsOf } from '@oxform/core/adapter';
import { expect, it } from 'vite-plus/test';
import { fixtures } from './fixtures';

const setup = () => ({ form: fixtures.empty(), [Symbol.dispose]() {} });

it('makes a form with no extension', () => {
  using subject = setup();

  expect(slotsOf(subject.form)).toEqual({});
});
