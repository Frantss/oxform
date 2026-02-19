import { createField } from '#form/create-field';
import { createForm } from '#form/create-form';
import { expect, expectTypeOf, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  object: z.object({
    array: z
      .object({
        value: z.string(),
      })
      .array(),
  }),
  nested: z.object({
    enabled: z.boolean(),
  }),
  tags: z.string().array(),
});

const defaultValues = {
  name: 'john',
  age: 20,
  object: {
    array: [{ value: 'first' }],
  },
  nested: {
    enabled: false,
  },
  tags: ['a'],
};

const setup = () => {
  const form = createForm({
    schema,
    defaultValues,
  });
  const unmount = form.store.mount();

  return {
    form,
    [Symbol.dispose]: () => {
      unmount();
    },
  };
};

it('accepts valid field paths for get and change', () => {
  using context = setup();
  const { form } = context;

  form.field.change('name', 'jane');
  form.field.change('age', 21);
  form.field.change('nested.enabled', true);

  const name = form.field.get('name');
  const age = form.field.get('age');
  const enabled = form.field.get('nested.enabled');

  expect(name).toBe('jane');
  expect(age).toBe(21);
  expect(enabled).toBe(true);
});

it('accepts valid array field paths for array methods', () => {
  using context = setup();
  const { form } = context;

  form.array.append('tags', 'b');
  const tags = form.field.get('tags');

  expect(tags).toEqual(['a', 'b']);
});

it('infers correct value types from field paths', () => {
  using context = setup();
  const { form } = context;

  expectTypeOf(form.field.get('name')).toEqualTypeOf<string>();
  expectTypeOf(form.field.get('age')).toEqualTypeOf<number>();
  expectTypeOf(form.field.get('nested.enabled')).toEqualTypeOf<boolean>();
  expectTypeOf(form.field.get('tags')).toEqualTypeOf<string[]>();
  expectTypeOf(form.field.get('tags.0')).toEqualTypeOf<string | undefined>();
  expectTypeOf(form.field.get('object.array.0.value')).toEqualTypeOf<string | undefined>();
});

it('infers updater types for change correctly', () => {
  using context = setup();
  const { form } = context;

  form.field.change('name', current => {
    expectTypeOf(current).toEqualTypeOf<string>();
    return current.toUpperCase();
  });

  form.field.change('age', current => {
    expectTypeOf(current).toEqualTypeOf<number>();
    return current + 1;
  });

  form.field.change('nested.enabled', current => {
    expectTypeOf(current).toEqualTypeOf<boolean>();
    return !current;
  });

  const age = form.field.get('age');
  expect(age).toBe(21);
});

it('exposes status via form.status getter', () => {
  using context = setup();
  const { form } = context;

  expect(form.status).toEqual(form.store.state.status);
  expectTypeOf(form.status).toEqualTypeOf(form.store.state.status);
});

it('updates options via ~update', async () => {
  using context = setup();
  const { form } = context;
  const next = {
    schema: z.object({
      name: z.string().min(6, 'Name too short after update'),
      age: z.number(),
      object: z.object({
        array: z
          .object({
            value: z.string(),
          })
          .array(),
      }),
      nested: z.object({
        enabled: z.boolean(),
      }),
      tags: z.string().array(),
    }),
    defaultValues,
  };

  form['~update'](next);
  const [valid] = await form.validate('name');

  expect(valid).toBe(false);
});

it('infers field extra from global and field plugins (single or array)', () => {
  const form = createForm({
    schema,
    defaultValues,
    with: {
      '*': field => ({
        dirty: field.options.form.status.dirty,
      }),
      name: [
        field => ({
          length: field.value.length,
        }),
      ],
      age: field => ({
        next: field.value + 1,
      }),
    },
  });

  const name = createField({ form, name: 'name' });
  const age = createField({ form, name: 'age' });

  expectTypeOf(name.extra.dirty).toEqualTypeOf<boolean>();
  expectTypeOf(name.extra.length).toEqualTypeOf<number>();
  expectTypeOf(age.extra.dirty).toEqualTypeOf<boolean>();
  expectTypeOf(age.extra.next).toEqualTypeOf<number>();
});
