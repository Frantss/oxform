import { withRoot } from '#tests/setup';
import { createField, createFieldApi, createForm, createSubscribe } from '@oxform/solid/v2';
import { createEffect, createSignal, flush } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const options = { schema: z.object({ name: z.string(), other: z.string() }), defaultValues: { name: 'Ada', other: 'Grace' } };

it('should keep imperative reads current while reactive getters wait for a flush', () => {
  const { form, field, read } = withRoot(() => {
    const form = createForm(options);
    const field = createField({ form, name: 'name' });
    const read = vi.fn();
    createEffect(() => [field.value, field.state.value, field.props.value], read);
    return { form, field, read };
  });
  const state = field.state;
  const props = field.props;
  const change = field.change;
  change('Lin');
  expect(field.get()).toBe('Lin');
  expect(form.values.name).toBe('Lin');
  expect(field.value).toBe('Ada');
  flush();
  expect(field.value).toBe('Lin');
  expect(read.mock.calls.map(([value]) => value)).toEqual([
    ['Ada', 'Ada', 'Ada'],
    ['Lin', 'Lin', 'Lin'],
  ]);
  expect(field.state).toBe(state);
  expect(field.props).toBe(props);
  expect(field.change).toBe(change);
});

it('should isolate sibling and status-only changes from value consumers', () => {
  const { form, field, read } = withRoot(() => {
    const form = createForm(options);
    const field = createField({ form, name: 'name' });
    const read = vi.fn();
    createEffect(() => field.state.value, read);
    return { form, field, read };
  });
  form.field.change('other', 'Lin');
  field.focus();
  field.blur();
  flush();
  expect(read).toHaveBeenCalledOnce();
  expect(field.state.status.touched).toBe(true);
  expect(field.state.status.blurred).toBe(true);
});

it('should move owned refs and retained handlers to the committed binding', () => {
  const { form, field, setName } = withRoot(() => {
    const form = createForm(options);
    const [name, setName] = createSignal<'name' | 'other'>('name');
    return { form, field: createField(() => ({ form, name: name() })), setName };
  });
  const element = document.createElement('input');
  const change = field.change;
  field.register(element);
  flush();
  setName('other');
  change('Before');
  expect(form.values.name).toBe('Before');
  flush();
  expect(field.value).toBe('Grace');
  expect(form.store.state.fields['~root.name'].ref).toBeNull();
  expect(field.state.ref).toBe(element);
  change('After');
  flush();
  expect(form.values).toEqual({ name: 'Before', other: 'After' });
  expect(field.change).toBe(change);
});

it('should follow option getters when the form changes', () => {
  const { first, second, field, setForm } = withRoot(() => {
    const first = createForm(options);
    const second = createForm({ ...options, defaultValues: { name: 'Lin', other: '' } });
    const [form, setForm] = createSignal(first);
    const field = createField({
      get form() {
        return form();
      },
      name: 'name',
    });
    return { first, second, field, setForm };
  });
  setForm(second);
  flush();
  expect(field.value).toBe('Lin');
  field.change('Alan');
  flush();
  expect(first.values.name).toBe('Ada');
  expect(second.values.name).toBe('Alan');
});

it('should expose imperative fields with separately selected reactive values', () => {
  const { field, selected } = withRoot(() => {
    const form = createForm(options);
    const field = createFieldApi({ form, name: 'name' });
    return { field, selected: createSubscribe(field, state => state.value) };
  });
  field.change('Lin');
  expect(field.value).toBe('Lin');
  expect(selected()).toBe('Ada');
  expect('props' in field).toBe(false);
  flush();
  expect(selected()).toBe('Lin');
});

it('should retain values and issues and release only the owned ref on disposal', () => {
  const { form, field, dispose } = withRoot(dispose => {
    const form = createForm(options);
    return { form, field: createField({ form, name: 'name' }), dispose };
  });
  field.register(document.createElement('input'));
  field.change('Lin');
  field.setIssues({ error: [{ level: 'error', issue: { message: 'Manual' } }] });
  flush();
  dispose();
  expect(form.values.name).toBe('Lin');
  expect(form.field.issues('name').error[0].issue.message).toBe('Manual');
  expect(form.store.state.fields['~root.name'].ref).toBeNull();
});

it('should preserve a replacement ref registered by another owner', () => {
  const { form, field, dispose } = withRoot(dispose => {
    const form = createForm(options);
    return { form, field: createFieldApi({ form, name: 'name' }), dispose };
  });
  field.register(document.createElement('input'));
  const replacement = document.createElement('input');
  form.field.register('name')(replacement);
  dispose();
  expect(form.store.state.fields['~root.name'].ref).toBe(replacement);
});
