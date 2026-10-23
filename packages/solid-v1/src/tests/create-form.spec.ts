import { withRoot } from '#tests/setup';
import { createForm, createFormStatus, createSubscribe } from '@oxform/solid';
import { createForm as createCoreForm } from '@oxform/core';
import { createComputed, createSignal } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({ name: z.string(), other: z.string() });
const defaultValues = { name: 'Ada', other: '' };

it('should preserve form and method identity while updating options without resetting values', () =>
  withRoot(() => {
    const [defaults, setDefaults] = createSignal(defaultValues);
    const [id, setId] = createSignal('initial');
    const form = createForm(() => ({ schema, defaultValues: defaults(), id: id() }));
    const reset = form.reset;
    const status = form.status;
    form.field.change('name', 'Grace');
    setDefaults({ name: 'Lin', other: '' });
    setId('next');
    expect(form.id).toBe('initial');
    expect(form.reset).toBe(reset);
    expect(form.status).toBe(status);
    expect(form.values.name).toBe('Grace');
    form.reset();
    expect(form.values.name).toBe('Lin');
  }));

it('should notify only consumers of changed status properties', () =>
  withRoot(() => {
    const form = createForm({ schema, defaultValues });
    const submitting = vi.fn();
    const touched = vi.fn();
    createComputed(() => submitting(form.status.submitting));
    createComputed(() => touched(form.status.touched));
    form.field.change('name', 'Grace');
    expect(submitting).toHaveBeenCalledTimes(1);
    expect(touched.mock.calls).toEqual([[false], [true]]);
  }));

it('should keep values as imperative snapshots and select values explicitly', () =>
  withRoot(() => {
    const form = createForm({ schema, defaultValues });
    const snapshot = vi.fn();
    const selected = vi.fn();
    const name = createSubscribe(form, state => state.values.name);
    createComputed(() => snapshot(form.values.name));
    createComputed(() => selected(name()));
    form.field.change('name', 'Grace');
    expect(snapshot.mock.calls).toEqual([['Ada']]);
    expect(selected.mock.calls).toEqual([['Ada'], ['Grace']]);
  }));

it('should expose pending, failed and successful submit status from core', async () => {
  const { form, pending, complete } = withRoot(() => {
    let complete!: () => void;
    const pending = new Promise<void>(resolve => {
      complete = resolve;
    });
    return { form: createForm({ schema: z.object({ name: z.string().min(1) }), defaultValues: { name: '' } }), pending, complete };
  });
  const failure = vi.fn();
  await form.submit(vi.fn(), failure)();
  expect(failure).toHaveBeenCalledOnce();
  expect(form.status.valid).toBe(false);
  expect(form.status.submits).toBe(1);
  form.field.change('name', 'Ada');
  const submission = form.submit(() => pending)();
  await vi.waitFor(() => expect(form.status.submitting).toBe(true));
  complete();
  await submission;
  expect(form.status.submitting).toBe(false);
  expect(form.status.successful).toBe(true);
  expect(form.status.submits).toBe(2);
});

it('should subscribe to a core-created form and follow a changing form source', () =>
  withRoot(() => {
    const first = createCoreForm({ schema, defaultValues });
    const second = createCoreForm({ schema, defaultValues });
    const [form, setForm] = createSignal(first);
    const status = createFormStatus(() => ({ form: form() }));
    first.field.change('name', 'Grace');
    expect(status.dirty).toBe(true);
    setForm(second);
    expect(status.dirty).toBe(false);
    first.field.focus('other');
    expect(status.touched).toBe(false);
    second.field.focus('other');
    expect(status.touched).toBe(true);
  }));

it('should release form status subscriptions on owner disposal', () => {
  const { form, dispose, selected } = withRoot(dispose => {
    const form = createForm({ schema, defaultValues });
    const selected = vi.fn();
    createComputed(() => selected(form.status.dirty));
    return { form, dispose, selected };
  });
  dispose();
  form.field.change('name', 'Grace');
  expect(selected.mock.calls).toEqual([[false]]);
  expect(form.values.name).toBe('Grace');
});

it('should reject creation without a Solid owner', () => {
  expect(() => createForm({ schema, defaultValues })).toThrow('require a Solid owner');
});
