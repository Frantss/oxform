import type { FormIssue } from '#form-api.types';
import { expect, it } from 'vitest';

import { setup } from './setup';

const issueA: FormIssue = {
  code: 'custom_a',
  message: 'Issue A',
  path: ['name'],
} as never;

const issueB: FormIssue = {
  code: 'custom_b',
  message: 'Issue B',
  path: ['name'],
} as never;

it('replaces errors by default', () => {
  using context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', [issueB]);
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueB]);
});

it('appends errors in append mode', () => {
  using context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', [issueB], { mode: 'append' });
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueA, issueB]);
});

it('keeps existing errors in keep mode when present', () => {
  using context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', [issueB], { mode: 'keep' });
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueA]);
});

it('sets errors in keep mode when no existing errors are present', () => {
  using context = setup();

  context.field.setErrors('name', [issueB], { mode: 'keep' });
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueB]);
});

it('updates form validity to invalid when errors are set', () => {
  using context = setup();

  context.field.setErrors('name', [issueA]);
  const valid = context.core.store.state.status.valid;

  expect(valid).toBe(false);
});

it('updates form validity to valid when errors are cleared', () => {
  using context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', []);
  const valid = context.core.store.state.status.valid;

  expect(valid).toBe(true);
});
