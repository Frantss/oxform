import { expect, it } from 'vite-plus/test';
import { defineForm, slotsOf } from '#main/form';
import { values } from './values';

it('applies an extension named values', () => {
  expect(slotsOf(defineForm().extend(values))).toEqual(['values']);
});
