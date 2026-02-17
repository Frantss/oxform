import type { FormIssue } from '#types/api';
import { expect, it } from 'vitest';

import { setup } from './setup';

const issue: FormIssue = {
  code: 'custom',
  message: 'Issue',
  path: ['name'],
} as never;

it('resets a field value to its default value', () => {
  using context = setup();

  context.field.change('name', 'updated');
  context.field.reset('name');
  const value = context.field.get('name');

  expect(value).toBe('name');
});

it('resets a nested field value to its default value', () => {
  using context = setup();

  context.field.change('nested.value', 'updated nested');
  context.field.reset('nested.value');
  const value = context.field.get('nested.value');

  expect(value).toBe('value');
});

it('resets a field value to the provided reset value', () => {
  using context = setup();

  context.field.change('name', 'updated');
  context.field.reset('name', { value: 'custom reset' });
  const value = context.field.get('name');

  expect(value).toBe('custom reset');
});

it('sets dirty to false after reset', () => {
  using context = setup();

  context.field.change('name', 'updated');
  context.field.reset('name');
  const meta = context.field.meta('name');

  expect(meta.dirty).toBe(false);
});

it('sets touched to false after reset', () => {
  using context = setup();

  context.field.focus('name');
  context.field.reset('name');
  const meta = context.field.meta('name');

  expect(meta.touched).toBe(false);
});

it('sets blurred to false after reset', () => {
  using context = setup();

  context.field.blur('name');
  context.field.reset('name');
  const meta = context.field.meta('name');

  expect(meta.blurred).toBe(false);
});

it('clears field errors after reset', () => {
  using context = setup();

  context.field.setErrors('name', [issue]);
  context.field.reset('name');
  const errors = context.field.errors('name');

  expect(errors).toEqual([]);
});

it('keeps sibling field value unchanged when resetting a different field', () => {
  using context = setup();

  context.field.change('count', 2);
  context.field.change('name', 'updated');
  context.field.reset('name');
  const value = context.field.get('count');

  expect(value).toBe(2);
});
