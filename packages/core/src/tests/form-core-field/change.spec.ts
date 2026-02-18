import { expect, it, vi } from 'vitest';
import z from 'zod';

import { setup } from './setup';

it('updates a field value with a direct value', () => {
  using context = setup();

  context.field.change('name', 'updated');
  const value = context.field.get('name');

  expect(value).toBe('updated');
});

it('updates a field value with an updater function', () => {
  using context = setup();

  context.field.change('name', current => `${current} updated`);
  const value = context.field.get('name');

  expect(value).toBe('name updated');
});

it('updates a nested field value', () => {
  using context = setup();

  context.field.change('nested.value', 'updated nested');
  const value = context.field.get('nested.value');

  expect(value).toBe('updated nested');
});

it('marks the field as dirty by default', () => {
  using context = setup();

  context.field.change('name', 'updated');
  const meta = context.field.meta('name');

  expect(meta.dirty).toBe(true);
});

it('marks the field as touched by default', () => {
  using context = setup();

  context.field.change('name', 'updated');
  const meta = context.field.meta('name');

  expect(meta.touched).toBe(true);
});

it('does not mark the field as dirty when should.dirty is false', () => {
  using context = setup();

  context.field.change('name', 'updated', { should: { dirty: false } });
  const meta = context.field.meta('name');

  expect(meta.dirty).toBe(false);
});

it('does not mark the field as touched when should.touch is false', () => {
  using context = setup();

  context.field.change('name', 'updated', { should: { touch: false } });
  const meta = context.field.meta('name');

  expect(meta.touched).toBe(false);
});

it('marks an ascendant field as dirty when changing a nested field', () => {
  using context = setup();

  context.field.change('nested.value', 'updated nested');
  const meta = context.field.meta('nested');

  expect(meta.dirty).toBe(true);
});

it('marks an ascendant field as touched when changing a nested field', () => {
  using context = setup();

  context.field.change('nested.value', 'updated nested');
  const meta = context.field.meta('nested');

  expect(meta.touched).toBe(true);
});

it('does not mark a descendant field as dirty when changing its parent field', () => {
  using context = setup();

  context.field.change('nested', { value: 'updated nested parent' });
  const meta = context.field.meta('nested.value');

  expect(meta.dirty).toBe(false);
});

it('does not mark a descendant field as touched when changing its parent field', () => {
  using context = setup();

  context.field.change('nested', { value: 'updated nested parent' });
  const meta = context.field.meta('nested.value');

  expect(meta.touched).toBe(false);
});

it('does not validate by default when changing a field', () => {
  using context = setup();
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.change('name', 'updated');

  expect(validate).not.toHaveBeenCalled();
});

it('validates by default when changing a field and a change validator is configured', () => {
  using context = setup({
    validate: {
      change: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.change('name', 'updated');

  expect(validate).toHaveBeenCalledOnce();
  expect(validate).toHaveBeenCalledWith('name', { type: 'change' });
});

it('skips validation when should.validate is false', () => {
  using context = setup({
    validate: {
      change: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.change('name', 'updated', { should: { validate: false } });

  expect(validate).not.toHaveBeenCalled();
});

it('batches value and meta updates into a single store notification', () => {
  using context = setup();
  const listener = vi.fn();

  context.core.persisted.subscribe(listener);
  context.field.change('name', 'updated', { should: { validate: false } });

  // core.set + fields.set are batched, so listeners fire only once
  expect(listener).toHaveBeenCalledOnce();

  // Verify both value and meta were applied in the same notification
  const value = context.field.get('name');
  const meta = context.field.meta('name');

  expect(value).toBe('updated');
  expect(meta.touched).toBe(true);
  expect(meta.dirty).toBe(true);
});
