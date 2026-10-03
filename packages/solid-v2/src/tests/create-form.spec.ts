import { withRoot } from '#tests/setup';
import { createForm, createFormStatus, createSubscribe } from 'oxform-solid/v2';
import { createForm as createCoreForm } from 'oxform-core';
import { createEffect, createSignal, flush } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({ name: z.string(), other: z.string() });
const defaultValues = { name: 'Ada', other: '' };

it('should commit updated options without resetting current values or changing identities', () => {
  const { form, setDefaults, setId } = withRoot(() => {
    const [defaults, setDefaults] = createSignal(defaultValues);
    const [id, setId] = createSignal('initial');
    return { form: createForm(() => ({ schema, defaultValues: defaults(), id: id() })), setDefaults, setId };
  });
  const reset = form.reset;
  const status = form.status;
  form.field.change('name', 'Grace');
  setDefaults({ name: 'Lin', other: '' });
  setId('next');
  flush();
  expect(form.values.name).toBe('Grace');
  expect(form.id).toBe('initial');
  expect(form.reset).toBe(reset);
  expect(form.status).toBe(status);
  form.reset();
  expect(form.values.name).toBe('Lin');
});

it('should update only consumers of changed status properties', () => {
  const { form, submitting, touched } = withRoot(() => {
    const form = createForm({ schema, defaultValues });
    const submitting = vi.fn();
    const touched = vi.fn();
    createEffect(() => form.status.submitting, submitting);
    createEffect(() => form.status.touched, touched);
    return { form, submitting, touched };
  });
  form.field.change('name', 'Grace');
  expect(form.status.touched).toBe(false);
  flush();
  expect(submitting).toHaveBeenCalledOnce();
  expect(touched.mock.calls.map(([value]) => value)).toEqual([false, true]);
});

it('should expose pending, failed and successful submission through committed status', async () => {
  let complete!: () => void;
  const pending = new Promise<void>(resolve => {
    complete = resolve;
  });
  const form = withRoot(() => createForm({ schema: z.object({ name: z.string().min(1) }), defaultValues: { name: '' } }));
  const failure = vi.fn();
  await form.submit(vi.fn(), failure)();
  flush();
  expect(failure).toHaveBeenCalledOnce();
  expect(form.status.valid).toBe(false);
  expect(form.status.submits).toBe(1);
  form.field.change('name', 'Ada');
  const submission = form.submit(() => pending)();
  flush();
  expect(form.status.submitting).toBe(true);
  complete();
  await submission;
  flush();
  expect(form.status.submitting).toBe(false);
  expect(form.status.successful).toBe(true);
  expect(form.status.submits).toBe(2);
});

it('should subscribe to core forms and release subscriptions on source change and disposal', () => {
  const { first, second, status, setForm, selected, dispose } = withRoot(dispose => {
    const first = createCoreForm({ schema, defaultValues });
    const second = createCoreForm({ schema, defaultValues });
    const [form, setForm] = createSignal(first);
    const selected = vi.fn((state: typeof first.store.state) => state.values.name);
    createSubscribe(form, selected);
    return { first, second, status: createFormStatus(() => ({ form: form() })), setForm, selected, dispose };
  });
  first.field.change('name', 'Grace');
  flush();
  expect(status.dirty).toBe(true);
  setForm(second);
  flush();
  expect(status.dirty).toBe(false);
  selected.mockClear();
  first.field.change('name', 'Lin');
  flush();
  expect(selected).not.toHaveBeenCalled();
  dispose();
  second.field.change('name', 'Alan');
  flush();
  expect(selected).not.toHaveBeenCalled();
});

it('should reject creation without a Solid owner', () => {
  expect(() => createForm({ schema, defaultValues })).toThrow('require a Solid owner');
});
