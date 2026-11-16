import { expect, it } from 'vite-plus/test';
import { defineForm, slotsOf } from '#main/form';
import { schemaOf } from '../../tests/helpers';
import { values } from './values';

const setup = () => ({ form: defineForm({ schema: schemaOf<object>(), defaultValues: {} }).extend(values), [Symbol.dispose]() {} });

it('applies an extension named values', () => {
  using subject = setup();

  expect(slotsOf(subject.form)).toEqual(['values']);
});
