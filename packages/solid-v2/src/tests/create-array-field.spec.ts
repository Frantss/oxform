import { withRoot } from '#tests/setup';
import { createArrayField, createForm } from '@oxform/solid/v2';
import { createSignal, flush } from 'solid-js';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({ items: z.object({ name: z.string() }).array(), other: z.object({ name: z.string() }).array() });

it('should retain the ids container on unrelated changes and preserve item identity through array operations', () => {
  const { form, array } = withRoot(() => {
    const form = createForm({ schema, defaultValues: { items: [{ name: 'Ada' }, { name: 'Grace' }], other: [] } });
    return { form, array: createArrayField({ form, name: 'items' }) };
  });
  const ids = array.ids;
  form.field.focus('items.0.name');
  flush();
  expect(array.ids).toBe(ids);
  array.move(1, 0);
  expect(array.ids).toBe(ids);
  flush();
  expect(array.ids).toEqual([ids[1], ids[0]]);
  array.prepend({ name: 'Lin' });
  flush();
  const added = array.ids[0];
  expect(array.ids.slice(1)).toEqual([ids[1], ids[0]]);
  array.swap(0, 2);
  flush();
  expect(array.ids).toEqual([ids[0], ids[1], added]);
  array.remove(1);
  flush();
  expect(array.ids).toEqual([ids[0], added]);
  array.update(0, { name: 'Alan' });
  flush();
  expect(array.state.value).toEqual([{ name: 'Alan' }, { name: 'Lin' }]);
  expect(array.ids[0]).not.toBe(ids[0]);
  expect(array.ids[1]).toBe(added);
});

it('should follow a dynamic array name and retain mutation handlers', () => {
  const { form, array, setName } = withRoot(() => {
    const form = createForm({ schema, defaultValues: { items: [], other: [{ name: 'Grace' }] } });
    const [name, setName] = createSignal<'items' | 'other'>('items');
    return { form, array: createArrayField(() => ({ form, name: name() })), setName };
  });
  const append = array.append;
  setName('other');
  flush();
  expect(array.ids).toHaveLength(1);
  append({ name: 'Ada' });
  flush();
  expect(form.values.items).toEqual([]);
  expect(array.state.value).toEqual([{ name: 'Grace' }, { name: 'Ada' }]);
  expect(array.append).toBe(append);
});
