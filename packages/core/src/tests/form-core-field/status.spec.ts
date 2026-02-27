import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-field/setup';

it('returns untouched by default', () => {
  using context = setup();

  const status = context.field.status('name');

  expect(status.touched).toBe(false);
});

it('returns dirty as false by default', () => {
  using context = setup();

  const status = context.field.status('name');

  expect(status.dirty).toBe(false);
});

it('returns touched as true after focus', () => {
  using context = setup();

  context.field.focus('name');
  const status = context.field.status('name');

  expect(status.touched).toBe(true);
});

it('returns blurred as true after blur', () => {
  using context = setup();

  context.field.blur('name');
  const status = context.field.status('name');

  expect(status.blurred).toBe(true);
});
