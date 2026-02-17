import type { FormIssue } from '#types/api';
import { expect, it } from 'vitest';

import { setup } from './setup';

const nameIssue: FormIssue = {
  code: 'custom',
  message: 'Name issue',
  path: ['name'],
} as never;

const nestedIssue: FormIssue = {
  code: 'custom',
  message: 'Nested issue',
  path: ['nested', 'value'],
} as never;

it('returns an empty array by default', () => {
  using context = setup();

  const errors = context.field.errors('name');

  expect(errors).toEqual([]);
});

it('returns errors for a specific field', () => {
  using context = setup();

  context.field.setErrors('name', [nameIssue]);
  const errors = context.field.errors('name');

  expect(errors).toEqual([nameIssue]);
});

it('returns the ascendant field errors updated by descendant setErrors', () => {
  using context = setup();

  context.field.setErrors('nested', [nameIssue]);
  context.field.setErrors('nested.value', [nestedIssue]);
  const errors = context.field.errors('nested');

  expect(errors).toEqual([nameIssue]);
});

it('returns aggregated nested errors when nested option is enabled', () => {
  using context = setup();

  context.field.setErrors('nested.value', [nestedIssue]);
  const errors = context.field.errors('nested', { nested: true });

  expect(errors).toEqual([nestedIssue]);
});
