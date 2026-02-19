import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-field/setup';

it('returns untouched by default', () => {
  using context = setup();

  const meta = context.field.meta('name');

  expect(meta.touched).toBe(false);
});

it('returns dirty as false by default', () => {
  using context = setup();

  const meta = context.field.meta('name');

  expect(meta.dirty).toBe(false);
});

it('returns touched as true after focus', () => {
  using context = setup();

  context.field.focus('name');
  const meta = context.field.meta('name');

  expect(meta.touched).toBe(true);
});

it('returns blurred as true after blur', () => {
  using context = setup();

  context.field.blur('name');
  const meta = context.field.meta('name');

  expect(meta.blurred).toBe(true);
});
