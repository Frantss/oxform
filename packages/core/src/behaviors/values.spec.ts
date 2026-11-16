import { expect, it } from 'vite-plus/test';
import { defineForm } from '#main/form';
import { schemaOf } from '../../tests/helpers';
import { values } from './values';

const setup = () => {
  const instance = defineForm({ schema: schemaOf<object>(), defaultValues: {} }).extend(values).create();

  return Object.assign(instance, { [Symbol.dispose]: () => instance.destroy() });
};

it('adds no api member yet', () => {
  using instance = setup();

  expect(Object.keys(instance)).toEqual(['id', 'store', 'destroy']);
});
