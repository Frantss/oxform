import { defineForm } from '@oxform/core';
import { expect, it } from 'vite-plus/test';
import { createParts } from './create-parts';

it('reads the slots of a form through the adapter entry point', () => {
  expect(createParts(defineForm()).slots).toEqual([]);
});
