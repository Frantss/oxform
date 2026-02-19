import { createField } from '#form/create-field';
import { createForm } from '#form/create-form';
import { expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  nested: z.object({
    value: z.string(),
  }),
});

const defaultValues = {
  name: 'name',
  nested: {
    value: 'value',
  },
};

const setup = () => {
  const form = createForm({
    schema,
    defaultValues,
    with: {
      '*': field => ({
        globalLength: field.value.length,
        source: 'global',
      }),
      name: [
        field => ({
          localLength: field.value.length,
        }),
        () => ({
          source: 'field',
        }),
      ],
    },
  });
  const unmount = form['~mount']();

  const field = createField({
    form,
    name: 'name',
  });

  return {
    form,
    field,
    [Symbol.dispose]: () => {
      unmount();
    },
  };
};

it('gets and changes the field value', () => {
  using context = setup();

  context.field.change('updated');

  expect(context.field.get()).toBe('updated');
  expect(context.field.value).toBe('updated');
  expect(context.form.field.get('name')).toBe('updated');
});

it('builds extra from global and field plugins', () => {
  using context = setup();

  expect(context.field.extra.globalLength).toBe(4);
  expect(context.field.extra.localLength).toBe(4);
  expect(context.field.extra.source).toBe('field');
});

it('recomputes extra values on read', () => {
  using context = setup();

  expect(context.field.extra.localLength).toBe(4);

  context.field.change('updated');

  expect(context.field.extra.localLength).toBe(7);
  expect(context.field.extra.globalLength).toBe(7);
});

it('forwards focus and blur behavior to the underlying field', () => {
  using context = setup();

  context.field.focus();
  expect(context.form.field.meta('name').touched).toBe(true);

  context.field.blur();
  expect(context.form.field.meta('name').blurred).toBe(true);
});

it('forwards errors and reset operations', () => {
  using context = setup();

  context.field.setErrors([{ code: 'custom', message: 'issue', path: ['name'] } as never]);
  expect(context.field.errors()).toHaveLength(1);

  context.field.reset({ value: 'reset value' });
  expect(context.field.errors()).toEqual([]);
  expect(context.field.get()).toBe('reset value');
});
