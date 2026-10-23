import { withRoot } from '#tests/setup';
import { createArrayField, createForm } from '@oxform/solid';
import { createComputed, createSignal } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

it('should expose reactive array values, item ids and every core mutation', () =>
  withRoot(() => {
    const form = createForm({ schema: z.object({ tags: z.string().array() }), defaultValues: { tags: ['Ada', 'Grace'] } });
    const array = createArrayField({ form, name: 'tags' });
    const initial = array.ids;
    form.field.focus('tags');
    expect(array.ids).toBe(initial);
    const read = vi.fn();
    createComputed(() => read(array.state.value));
    array.append('Lin');
    array.insert(1, 'Alan');
    array.move(0, 2);
    array.swap(0, 1);
    array.update(0, 'Updated');
    expect(array.get()).toEqual(['Updated', 'Alan', 'Ada', 'Lin']);
    expect(array.ids[2]).toBe(initial[0]);
    array.remove(3);
    array.prepend('First');
    expect(array.state.value).toEqual(['First', 'Updated', 'Alan', 'Ada']);
    array.replace(['Only']);
    expect(array.state.value).toEqual(['Only']);
    expect(array.ids).toHaveLength(1);
    expect(read).toHaveBeenLastCalledWith(['Only']);
  }));

it('should rebind array reads, ids and retained mutation handlers', () =>
  withRoot(() => {
    const form = createForm({
      schema: z.object({ first: z.string().array(), second: z.string().array().nullable() }),
      defaultValues: { first: ['Ada'], second: null },
    });
    const [name, setName] = createSignal<'first' | 'second'>('first');
    const array = createArrayField(() => ({ form, name: name() }));
    const append = array.append;
    setName('second');
    expect(array.state.value).toBeUndefined();
    expect(form.values.second).toBeNull();
    expect(array.ids).toEqual([]);
    append('Grace');
    expect(array.state.value).toEqual(['Grace']);
    expect(form.values.first).toEqual(['Ada']);
    expect(array.ids).toHaveLength(1);
  }));
