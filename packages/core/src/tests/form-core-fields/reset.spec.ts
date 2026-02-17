import type { FormIssue } from '#types/api';
import { expect, it } from 'vitest';

import { setup } from './setup';

const issue: FormIssue = {
  code: 'custom',
  message: 'Issue',
  path: ['nested', 'value'],
} as never;

it('resets target field meta to defaults', () => {
  using context = setup();

  context.fields.set('nested.value', {
    meta: { dirty: true, touched: true, blurred: true },
  });
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested.value');

  expect(entry.meta).toEqual({ dirty: false, touched: false, blurred: false });
});

it('clears target field errors', () => {
  using context = setup();

  context.fields.set('nested.value', { errors: [issue] });
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested.value');

  expect(entry.errors).toEqual([]);
});

it('clears target field ref', () => {
  using context = setup();
  const element = {} as HTMLElement;

  context.fields.set('nested.value', { ref: element });
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested.value');

  expect(entry.ref).toBe(null);
});

it('resets descendant field when resetting a parent path', () => {
  using context = setup();
  const element = {} as HTMLElement;

  context.fields.set('nested.value', {
    meta: { dirty: true, touched: true, blurred: true },
    errors: [issue],
    ref: element,
  });
  context.fields.reset('nested');
  const entry = context.fields.get('nested.value');

  expect(entry).toEqual({
    id: entry.id,
    meta: { dirty: false, touched: false, blurred: false },
    errors: [],
    ref: null,
  });
});

it('keeps sibling field state unchanged when resetting another path', () => {
  using context = setup();
  const element = {} as HTMLElement;

  context.fields.set('name', {
    meta: { dirty: true, touched: true, blurred: true },
    errors: [issue],
    ref: element,
  });
  const expected = context.fields.get('name');
  context.fields.reset('nested');
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});

it('does not affect ascendant field state when resetting a descendant path', () => {
  using context = setup();
  const element = {} as HTMLElement;

  context.fields.set('nested', {
    meta: { dirty: true, touched: true, blurred: true },
    errors: [issue],
    ref: element,
  });
  const expected = context.fields.get('nested');
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested');

  expect(entry).toEqual(expected);
});
