import { expect, it } from 'vite-plus/test';
import { defineForm, slotsOf } from '#main/form';
import { values } from './values';

const setup = () => ({ form: defineForm().extend(values), [Symbol.dispose]() {} });

it('applies an extension named values', () => {
  using subject = setup();

  expect(slotsOf(subject.form)).toEqual(['values']);
});
