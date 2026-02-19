import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-array/setup';

it('moves an item forward in the array', () => {
  using context = setup();

  context.array.move('array', 0, 1);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('moves an item backward in the array', () => {
  using context = setup();

  context.array.move('array', 1, 0);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('keeps values unchanged when moving to the same index', () => {
  using context = setup();

  context.array.move('array', 1, 1);
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2']);
});

it('marks the array field as dirty by default', () => {
  using context = setup();

  context.array.move('array', 0, 1);
  const meta = context.field.meta('array');

  expect(meta.dirty).toBe(true);
});

it('marks the array field as touched by default', () => {
  using context = setup();

  context.array.move('array', 0, 1);
  const meta = context.field.meta('array');

  expect(meta.touched).toBe(true);
});

it('does not mark the array field as dirty when should.dirty is false', () => {
  using context = setup();

  context.array.move('array', 0, 1, { should: { dirty: false } });
  const meta = context.field.meta('array');

  expect(meta.dirty).toBe(false);
});

it('does not mark the array field as touched when should.touch is false', () => {
  using context = setup();

  context.array.move('array', 0, 1, { should: { touch: false } });
  const meta = context.field.meta('array');

  expect(meta.touched).toBe(false);
});

it('moves index 0 field entry id to index 1', () => {
  using context = setup();
  const beforeId = context.fields.get('array.0').id;

  context.array.move('array', 0, 1);
  const afterId = context.fields.get('array.1').id;

  expect(afterId).toBe(beforeId);
});

it('moves index 1 field entry id to index 0', () => {
  using context = setup();
  const beforeId = context.fields.get('array.1').id;

  context.array.move('array', 1, 0);
  const afterId = context.fields.get('array.0').id;

  expect(afterId).toBe(beforeId);
});
