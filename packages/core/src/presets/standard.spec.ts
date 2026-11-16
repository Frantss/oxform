import { expect, it } from 'vite-plus/test';
import { defineForm } from '#core';
import { standard } from '#core/presets';

const setup = () => {
  const schema = { '~standard': { version: 1 as const, vendor: 'test', validate: (value: unknown) => ({ value }) } };
  const instance = defineForm({ schema, defaultValues: {} }).extend(standard).create();

  return Object.assign(instance, { [Symbol.dispose]: () => instance.destroy() });
};

it('makes a form that creates an instance', () => {
  using instance = setup();

  expect(instance.id).toMatch(/^form-\d+$/u);
});
