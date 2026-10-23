import { withRoot } from '#tests/setup';
import { createFieldApi, createForm, createSubscribe } from '@oxform/solid';
import { createComputed, createSignal } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const options = { schema: z.object({ name: z.string(), other: z.string() }), defaultValues: { name: 'Ada', other: 'Grace' } };

it('should return the initial selection and skip unchanged selections', () =>
  withRoot(() => {
    const form = createForm(options);
    const name = createSubscribe(form, state => state.values.name);
    const read = vi.fn();
    createComputed(() => read(name()));
    form.field.change('other', 'Lin');
    form.field.change('name', 'Alan');
    expect(read.mock.calls).toEqual([['Ada'], ['Alan']]);
  }));

it('should use Object.is for selections including NaN and signed zero', () =>
  withRoot(() => {
    const form = createForm({ schema: z.object({ number: z.number() }), defaultValues: { number: Number.NaN } });
    const number = createSubscribe(form, state => state.values.number);
    const read = vi.fn();
    createComputed(() => read(number()));
    form.field.change('number', Number.NaN);
    expect(read).toHaveBeenCalledTimes(1);
    form.field.change('number', 0);
    form.field.change('number', -0);
    expect(read).toHaveBeenCalledTimes(3);
  }));

it('should switch subscriptions when an imperative field is rebound', () =>
  withRoot(() => {
    const form = createForm(options);
    const [name, setName] = createSignal<'name' | 'other'>('name');
    const field = createFieldApi(() => ({ form, name: name() }));
    const value = createSubscribe(field, state => state.value);
    setName('other');
    expect(value()).toBe('Grace');
    form.field.change('name', 'Lin');
    expect(value()).toBe('Grace');
    field.change('Alan');
    expect(value()).toBe('Alan');
  }));

it('should unsubscribe on disposal', () => {
  const { form, selected, dispose } = withRoot(dispose => {
    const form = createForm(options);
    const selected = vi.fn((state: typeof form.store.state) => state.values.name);
    createSubscribe(form, selected);
    return { form, selected, dispose };
  });
  selected.mockClear();
  dispose();
  form.field.change('name', 'Lin');
  expect(selected).not.toHaveBeenCalled();
});
