import { withRoot } from '#tests/setup';
import { createFieldApi, createForm, createFormEffect } from '@oxform/solid/v2';
import { createSignal, flush } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const options = { schema: z.object({ name: z.string(), other: z.string() }), defaultValues: { name: 'Ada', other: 'Grace' } };

it('should skip initial and deeply equal selections and coalesce writes within a flush', () => {
  const { form, callback } = withRoot(() => {
    const form = createForm(options);
    const callback = vi.fn();
    createFormEffect(form, state => ({ name: state.values.name }), callback);
    return { form, callback };
  });
  expect(callback).not.toHaveBeenCalled();
  form.field.change('other', 'Lin');
  flush();
  expect(callback).not.toHaveBeenCalled();
  form.field.change('name', 'Alan');
  form.field.change('name', 'Grace');
  expect(callback).not.toHaveBeenCalled();
  flush();
  expect(callback.mock.calls).toEqual([[{ name: 'Grace' }]]);
});

it('should observe writes made before the first flush', () => {
  const callback = vi.fn();
  const form = withRoot(() => {
    const form = createForm(options);
    createFormEffect(form, state => state.values.name, callback);
    form.field.change('name', 'Lin');
    return form;
  });
  expect(form.values.name).toBe('Lin');
  expect(callback.mock.calls).toEqual([['Lin']]);
});

it('should establish a new baseline on rebinding and stop after disposal', () => {
  const { form, field, setName, callback, dispose } = withRoot(dispose => {
    const form = createForm(options);
    const [name, setName] = createSignal<'name' | 'other'>('name');
    const field = createFieldApi(() => ({ form, name: name() }));
    const callback = vi.fn();
    createFormEffect(field, state => state.value, callback);
    return { form, field, setName, callback, dispose };
  });
  setName('other');
  flush();
  expect(callback).not.toHaveBeenCalled();
  form.field.change('name', 'Lin');
  flush();
  expect(callback).not.toHaveBeenCalled();
  field.change('Alan');
  flush();
  expect(callback.mock.calls).toEqual([['Alan']]);
  field.change('Queued');
  dispose();
  flush();
  expect(callback).toHaveBeenCalledOnce();
});

it('should apply callbacks in a writable scope without tracking callback reads', () => {
  const { form, callback, selected, setUnrelated } = withRoot(() => {
    const form = createForm(options);
    const [unrelated, setUnrelated] = createSignal(0);
    const [selected, setSelected] = createSignal('');
    const callback = vi.fn((value: string) => {
      unrelated();
      setSelected(value);
    });
    createFormEffect(form, state => state.values.name, callback);
    return { form, callback, selected, setUnrelated };
  });
  form.field.change('name', 'Lin');
  flush();
  expect(selected()).toBe('Lin');
  setUnrelated(1);
  flush();
  expect(callback).toHaveBeenCalledOnce();
});
