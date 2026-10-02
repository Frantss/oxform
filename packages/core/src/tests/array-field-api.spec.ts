import { createArrayField } from '#form/create-array-field';
import { createForm } from '#form/create-form';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  tags: z.string().array(),
});

const defaultValues = {
  tags: ['a'],
};

const setup = () => {
  const form = createForm({
    schema,
    defaultValues,
  });
  const array = createArrayField({
    form,
    name: 'tags',
  });

  return {
    form,
    array,
  };
};

const setupOptional = () => {
  const form = createForm({
    schema: z.object({
      tags: z.string().array().optional(),
    }),
    defaultValues: {
      tags: undefined,
    },
  });
  const array = createArrayField({
    form,
    name: 'tags',
  });

  return {
    form,
    array,
  };
};

const setupNested = () => {
  const form = createForm({
    schema: z.object({
      members: z.object({ name: z.string(), contacts: z.object({ email: z.string() }).array() }).array(),
    }),
    defaultValues: {
      members: [
        { name: 'Ada', contacts: [{ email: 'ada@example.com' }] },
        { name: 'Grace', contacts: [{ email: 'grace@example.com' }] },
      ],
    },
    checks: { warning: {} },
  });
  const array = createArrayField({ form, name: 'members' });
  form.field.setIssues('members.0.contacts.0.email', {
    warning: [{ level: 'warning', issue: { message: 'Review contact' } }],
  });
  const firstId = form.store.state.fields['~root.members.0.contacts.0.email'].id;
  return { form, array, firstId };
};

it('appends a value', () => {
  const context = setup();

  context.array.append('b');

  expect(context.array.get()).toEqual(['a', 'b']);
});

it('prepends a value', () => {
  const context = setup();

  context.array.prepend('z');

  expect(context.array.get()).toEqual(['z', 'a']);
});

it('array field api appends a value from an updater function', () => {
  const context = setup();

  context.array.append(() => 'b');

  expect(context.array.get()).toEqual(['a', 'b']);
});

it('prepends a value from an updater function', () => {
  const context = setup();

  context.array.prepend(() => 'z');

  expect(context.array.get()).toEqual(['z', 'a']);
});

it('inserts and removes values', () => {
  const context = setup();

  context.array.insert(1, 'b');
  context.array.remove(0);

  expect(context.array.get()).toEqual(['b']);
});

it('swaps values', () => {
  const context = setup();

  context.array.append('b');
  context.array.swap(0, 1);

  expect(context.array.get()).toEqual(['b', 'a']);
});

it('moves values', () => {
  const context = setup();

  context.array.append('b');
  context.array.move(1, 0);

  expect(context.array.get()).toEqual(['b', 'a']);
});

it('replaces and updates values', () => {
  const context = setup();

  context.array.replace(['x', 'y']);
  context.array.update(1, 'z');

  expect(context.array.get()).toEqual(['x', 'z']);
});

it('exposes array options', () => {
  const context = setup();

  expect(context.array.options.name).toBe('tags');
});

it('exposes array store value', () => {
  const context = setup();

  expect(context.array.store.state.value).toEqual(['a']);
});

it('exposes array state value', () => {
  const context = setup();

  expect(context.array.state.value).toEqual(['a']);
});

it('exposes array default value', () => {
  const context = setup();

  expect(context.array.state.defaultValue).toEqual(['a']);
});

it('generates one id for the initial array item', () => {
  const context = setup();

  expect(context.array.ids).toHaveLength(1);
});

it('generates string ids for array items', () => {
  const context = setup();

  expect(context.array.ids[0]).toBeTypeOf('string');
});

it('should keep item ids stable when reading and editing array fields', () => {
  const { array, form } = setup();
  const ids = array.ids;
  form.field.change('tags.0', 'edited');

  expect({ firstRead: array.ids, secondRead: array.ids }).toEqual({ firstRead: ids, secondRead: ids });
});

it('should move stable item ids with reordered items', () => {
  const { array } = setup();
  array.append('b');
  const [first, second] = array.ids;
  array.move(1, 0);

  expect(array.ids).toEqual([second, first]);
});

it('should move nested field ids and issues with array items', () => {
  const { form, array, firstId } = setupNested();
  array.move(0, 1);

  expect({
    id: form.store.state.fields['~root.members.1.contacts.0.email'].id,
    warnings: form.field.issues('members.1.contacts.0.email').warning.map(entry => entry.issue.message),
  }).toEqual({ id: firstId, warnings: ['Review contact'] });
});

it('should swap nested field ids with array items', () => {
  const { form, array, firstId } = setupNested();
  array.swap(0, 1);

  expect(form.store.state.fields['~root.members.1.contacts.0.email'].id).toBe(firstId);
});

it('should shift nested field ids when inserting array items', () => {
  const { form, array, firstId } = setupNested();
  array.insert(0, { name: 'Katherine', contacts: [] });

  expect(form.store.state.fields['~root.members.1.contacts.0.email'].id).toBe(firstId);
});

it('should delete removed descendants and shift the remaining nested fields', () => {
  const { form, array } = setupNested();
  const remainingId = form.store.state.fields['~root.members.1.contacts.0.email'].id;
  array.remove(0);

  expect({
    id: form.store.state.fields['~root.members.0.contacts.0.email'].id,
    warnings: form.field.issues('members.0.contacts.0.email').warning,
    stalePaths: Object.keys(form.store.state.fields).filter(path => path.startsWith('~root.members.1')),
  }).toEqual({ id: remainingId, warnings: [], stalePaths: [] });
});

it('returns empty generated ids when array value is absent', () => {
  const context = setupOptional();

  expect(context.array.ids).toEqual([]);
});

it('updates array field form option', () => {
  const context = setup();
  const unmount = context.array['~mount']();

  context.array['~update']({
    form: context.form,
    name: 'tags',
  });

  expect(context.array.options.form).toBe(context.form);
  unmount();
});

it('updates array field name option', () => {
  const context = setup();

  context.array['~update']({
    form: context.form,
    name: 'tags',
  });

  expect(context.array.options.name).toBe('tags');
});

it('mounts array field with an unmount function', () => {
  const context = setup();
  const unmount = context.array['~mount']();

  expect(unmount).toBeTypeOf('function');
  unmount();
});
