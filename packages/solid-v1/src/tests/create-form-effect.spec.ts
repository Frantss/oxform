import { withRoot } from '#tests/setup';
import { createFieldApi, createForm, createFormEffect } from 'oxform-solid';
import { createSignal } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const options = { schema: z.object({ name: z.string(), other: z.string() }), defaultValues: { name: 'Ada', other: 'Grace' } };

it('should skip the initial selection and deeply equal subsequent selections', () =>
  withRoot(() => {
    const form = createForm(options);
    const callback = vi.fn();
    createFormEffect(form, state => ({ name: state.values.name }), callback);
    expect(callback).not.toHaveBeenCalled();
    form.field.change('other', 'Lin');
    expect(callback).not.toHaveBeenCalled();
    form.field.change('name', 'Alan');
    expect(callback.mock.calls).toEqual([[{ name: 'Alan' }]]);
  }));

it('should rebind field effects and stop calling them on disposal', () => {
  const { form, field, callback, setName, dispose } = withRoot(dispose => {
    const form = createForm(options);
    const [name, setName] = createSignal<'name' | 'other'>('name');
    const field = createFieldApi(() => ({ form, name: name() }));
    const callback = vi.fn();
    createFormEffect(field, state => state.value, callback);
    return { form, field, callback, setName, dispose };
  });
  setName('other');
  expect(callback).not.toHaveBeenCalled();
  form.field.change('name', 'Lin');
  expect(callback).not.toHaveBeenCalled();
  field.change('Alan');
  expect(callback.mock.calls).toEqual([['Alan']]);
  dispose();
  form.field.change('other', 'Grace');
  expect(callback).toHaveBeenCalledOnce();
});
