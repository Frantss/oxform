import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-array/setup';

it('replaces array values with provided array', () => {
  using context = setup();

  context.array.replace('array', ['new1', 'new2', 'new3']);
  const value = context.field.get('array');

  expect(value).toEqual(['new1', 'new2', 'new3']);
});

it('replaces array values with updater function', () => {
  using context = setup();

  context.array.replace('array', current => [...current, 'item3']);
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2', 'item3']);
});

it('marks the array field as dirty by default', () => {
  using context = setup();

  context.array.replace('array', ['new1']);
  const meta = context.field.meta('array');

  expect(meta.dirty).toBe(true);
});

it('marks the array field as touched by default', () => {
  using context = setup();

  context.array.replace('array', ['new1']);
  const meta = context.field.meta('array');

  expect(meta.touched).toBe(true);
});

it('does not mark the array field as dirty when should.dirty is false', () => {
  using context = setup();

  context.array.replace('array', ['new1'], { should: { dirty: false } });
  const meta = context.field.meta('array');

  expect(meta.dirty).toBe(false);
});

it('does not mark the array field as touched when should.touch is false', () => {
  using context = setup();

  context.array.replace('array', ['new1'], { should: { touch: false } });
  const meta = context.field.meta('array');

  expect(meta.touched).toBe(false);
});

it('creates field entries for all replaced indices', () => {
  using context = setup();

  context.array.replace('array', ['new1', 'new2', 'new3']);
  const entry = context.fields.get('array.2');

  expect(entry).toEqual({
    id: entry.id,
    meta: { dirty: false, touched: false, blurred: false },
    errors: [],
    ref: null,
  });
});

it('removes field entries beyond new length', () => {
  using context = setup();

  context.array.replace('array', ['new1']);
  const entry = context.fields.get('array.1');

  expect(entry).toBeUndefined();
});

it('keeps sibling values unchanged', () => {
  using context = setup();

  context.array.replace('array', ['new1']);
  const value = context.field.get('sibling');

  expect(value).toBe('sibling');
});
