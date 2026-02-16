import type { FormIssue } from '#form-api.types';
import { expect, it } from 'vitest';

import { setup } from './setup';

const issue: FormIssue = {
  code: 'custom',
  message: 'Issue',
  path: ['name'],
} as never;

it('updates target entry meta', () => {
  using context = setup();
  const expected = context.fields.get('name');

  context.fields.set('name', { meta: { dirty: true } });
  const entry = context.fields.get('name');

  expect(entry).toEqual({
    ...expected,
    meta: { dirty: true, touched: false, blurred: false },
  });
});

it('updates target entry errors', () => {
  using context = setup();

  context.fields.set('name', { errors: [issue] });
  const entry = context.fields.get('name');

  expect(entry.errors).toEqual([issue]);
});

it('updates target entry ref', () => {
  using context = setup();
  const element = {} as HTMLElement;

  context.fields.set('name', { ref: element });
  const entry = context.fields.get('name');

  expect(entry.ref).toBe(element);
});

it('updates ascendant entry when setting a descendant path', () => {
  using context = setup();
  const expected = context.fields.get('nested');

  context.fields.set('nested.value', { meta: { touched: true } });
  const entry = context.fields.get('nested');

  expect(entry).toEqual({
    ...expected,
    meta: { dirty: false, touched: true, blurred: false },
  });
});

it('does not propagate errors to ascendant entries when setting a descendant path', () => {
  using context = setup();
  const expected = context.fields.get('nested');

  context.fields.set('nested.value', { meta: { touched: true }, errors: [issue] });
  const entry = context.fields.get('nested');

  expect(entry).toEqual({
    ...expected,
    meta: { dirty: false, touched: true, blurred: false },
  });
});

it('does not propagate refs to ascendant entries when setting a descendant path', () => {
  using context = setup();
  const expected = context.fields.get('nested');
  const element = {} as HTMLElement;

  context.fields.set('nested.value', { meta: { touched: true }, ref: element });
  const entry = context.fields.get('nested');

  expect(entry).toEqual({
    ...expected,
    meta: { dirty: false, touched: true, blurred: false },
  });
});

it('does not update descendant entry when setting a parent path', () => {
  using context = setup();
  const expected = context.fields.get('nested.value');

  context.fields.set('nested', { meta: { touched: true, dirty: true, blurred: true } });
  const entry = context.fields.get('nested.value');

  expect(entry).toEqual(expected);
});

it('does not update sibling entries', () => {
  using context = setup();
  const expected = context.fields.get('name');

  context.fields.set('nested.value', { meta: { touched: true } });
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});
