import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-array/setup';

it('appends a value to the end of an array', () => {
  using context = setup();

  context.array.append('array', 'item3');
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2', 'item3']);
});

it('appends a value from an updater function', () => {
  using context = setup();

  context.array.append('array', () => 'item3');
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2', 'item3']);
});

it('appends a value when array is undefined', () => {
  using context = setup();

  context.field.change('array', undefined as never);
  context.array.append('array', 'item3');
  const value = context.field.get('array');

  expect(value).toEqual(['item3']);
});

it('marks the array field as dirty by default', () => {
  using context = setup();

  context.array.append('array', 'item3');
  const meta = context.field.meta('array');

  expect(meta.dirty).toBe(true);
});

it('marks the array field as touched by default', () => {
  using context = setup();

  context.array.append('array', 'item3');
  const meta = context.field.meta('array');

  expect(meta.touched).toBe(true);
});

it('does not mark the array field as dirty when should.dirty is false', () => {
  using context = setup();

  context.array.append('array', 'item3', { should: { dirty: false } });
  const meta = context.field.meta('array');

  expect(meta.dirty).toBe(false);
});

it('does not mark the array field as touched when should.touch is false', () => {
  using context = setup();

  context.array.append('array', 'item3', { should: { touch: false } });
  const meta = context.field.meta('array');

  expect(meta.touched).toBe(false);
});

it('creates a field entry for the appended index', () => {
  using context = setup();

  context.array.append('array', 'item3');
  const entry = context.fields.get('array.2');

  expect(entry).toEqual({
    id: entry.id,
    meta: { dirty: false, touched: false, blurred: false },
    errors: [],
    ref: null,
  });
});

it('keeps sibling values unchanged', () => {
  using context = setup();

  context.array.append('array', 'item3');
  const value = context.field.get('sibling');

  expect(value).toBe('sibling');
});
