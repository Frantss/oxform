import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-fields/setup';

it('adds entries for new value paths', () => {
  using context = setup();

  context.core.set('nested.extra', 'extra');
  context.fields.adjust();
  const entry = context.fields.get('nested.extra');

  expect(entry).toEqual({
    id: entry.id,
    meta: { dirty: false, touched: false, blurred: false },
    errors: [],
    ref: null,
  });
});

it('preserves existing entry state when path already exists', () => {
  using context = setup();

  context.fields.set('name', {
    meta: { dirty: true, touched: true, blurred: true },
  });
  const expected = context.fields.get('name');
  context.fields.adjust();
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});

it('keeps unrelated entries unchanged', () => {
  using context = setup();

  const expected = context.fields.get('name');
  context.core.set('nested.extra', 'extra');
  context.fields.adjust();
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});
