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
  expect(context.form.field.get('name')).toBe('updated');
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
