import { defineForm } from '@oxform/core';
import { expect, it } from 'vite-plus/test';
import { createParts } from './create-parts';

const setup = () => ({
  parts: createParts(
    defineForm({ schema: { '~standard': { version: 1, vendor: 'test', validate: (value: unknown) => ({ value }) } }, defaultValues: {} }),
  ),
  [Symbol.dispose]() {},
});

it('reads the slots of a form through the adapter entry point', () => {
  using subject = setup();

  expect(subject.parts.slots).toEqual([]);
});
