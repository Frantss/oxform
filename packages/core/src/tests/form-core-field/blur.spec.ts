import { expect, it, vi } from 'vitest';
import z from 'zod';

import { setup } from '#tests/form-core-field/setup';

it('blurs a registered element reference', () => {
  using context = setup();
  const element = document.createElement('input');
  document.body.append(element);
  element.focus();

  context.field.register('name')(element);
  context.field.blur('name');

  expect(document.activeElement).not.toBe(element);
  element.remove();
});

it('marks the field as blurred', () => {
  using context = setup();

  context.field.blur('name');
  const meta = context.field.meta('name');

  expect(meta.blurred).toBe(true);
});

it('marks an ascendant field as blurred when blurring a nested field', () => {
  using context = setup();

  context.field.blur('nested.value');
  const meta = context.field.meta('nested');

  expect(meta.blurred).toBe(true);
});

it('does not mark a descendant field as blurred when blurring a parent field', () => {
  using context = setup();

  context.field.blur('nested');
  const meta = context.field.meta('nested.value');

  expect(meta.blurred).toBe(false);
});

it('does not validate by default when blurring a field', () => {
  using context = setup();
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.blur('name');

  expect(validate).not.toHaveBeenCalled();
});

it('validates by default when blurring a field and a blur validator is configured', () => {
  using context = setup({
    validate: {
      blur: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.blur('name');

  expect(validate).toHaveBeenCalledOnce();
  expect(validate).toHaveBeenCalledWith('name', { type: 'blur' });
});

it('skips validation when should.validate is false', () => {
  using context = setup({
    validate: {
      blur: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.blur('name', { should: { validate: false } });

  expect(validate).not.toHaveBeenCalled();
});

it('does not update state when the field is already blurred', () => {
  using context = setup();

  context.field.blur('name');
  const set = vi.spyOn(context.fields, 'set');

  context.field.blur('name');

  expect(set).not.toHaveBeenCalled();
});
