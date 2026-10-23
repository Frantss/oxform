import { withRoot } from '#tests/setup';
import { createField, createFieldApi, createForm, createSubscribe } from '@oxform/solid';
import { createComputed, createSignal } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({ name: z.string(), other: z.string() });
const options = { schema, defaultValues: { name: 'Ada', other: 'Grace' } };

it('should keep field state and handlers stable while updating reactive properties', () =>
  withRoot(() => {
    const form = createForm(options);
    const field = createField({ form, name: 'name' });
    const state = field.state;
    const props = field.props;
    const change = field.change;
    const read = vi.fn();
    createComputed(() => read(field.value, field.state.value, field.props.value));
    change('Lin');
    expect(read.mock.calls).toEqual([
      ['Ada', 'Ada', 'Ada'],
      ['Lin', 'Lin', 'Lin'],
    ]);
    expect(field.state).toBe(state);
    expect(field.props).toBe(props);
    expect(field.change).toBe(change);
    expect(field.id).toBe(field.state.id);
    expect(field.state.defaultValue).toBe('Ada');
  }));

it('should isolate sibling changes and status-only changes from value consumers', () =>
  withRoot(() => {
    const form = createForm(options);
    const field = createField({ form, name: 'name' });
    const read = vi.fn();
    createComputed(() => read(field.state.value));
    form.field.change('other', 'Lin');
    field.focus();
    field.blur();
    expect(read.mock.calls).toEqual([['Ada']]);
    expect(field.state.status.touched).toBe(true);
    expect(field.state.status.blurred).toBe(true);
  }));

it('should rebind reads, writes, subscriptions and registered refs when the name changes', () =>
  withRoot(() => {
    const form = createForm(options);
    const [name, setName] = createSignal<'name' | 'other'>('name');
    const field = createField(() => ({ form, name: name() }));
    const element = document.createElement('input');
    const change = field.change;
    field.register(element);
    setName('other');
    expect(field.value).toBe('Grace');
    expect(form.store.state.fields['~root.name'].ref).toBeNull();
    expect(field.state.ref).toBe(element);
    change('Lin');
    expect(form.values).toEqual({ name: 'Ada', other: 'Lin' });
    form.field.change('name', 'Alan');
    expect(field.value).toBe('Lin');
    expect(field.change).toBe(change);
  }));

it('should follow getters in an options object and changing form instances', () =>
  withRoot(() => {
    const first = createForm(options);
    const second = createForm({ ...options, defaultValues: { name: 'Lin', other: '' } });
    const [form, setForm] = createSignal(first);
    const [name, setName] = createSignal<'name' | 'other'>('name');
    const field = createField({
      get form() {
        return form();
      },
      get name() {
        return name();
      },
    });
    setName('other');
    expect(field.value).toBe('Grace');
    setName('name');
    setForm(second);
    expect(field.value).toBe('Lin');
    field.change('Alan');
    expect(first.values.name).toBe('Ada');
    expect(second.values.name).toBe('Alan');
  }));

it('should expose an imperative field without reactive state or input props', () =>
  withRoot(() => {
    const form = createForm(options);
    const field = createFieldApi({ form, name: 'name' });
    const read = vi.fn();
    createComputed(() => read(field.value));
    field.change('Lin');
    expect(read.mock.calls).toEqual([['Ada']]);
    expect(field.value).toBe('Lin');
    expect('props' in field).toBe(false);
    const value = createSubscribe(field, state => state.value);
    expect(value()).toBe('Lin');
  }));

it('should retain values and issues but remove only the owned ref on disposal', () => {
  const { form, dispose } = withRoot(dispose => {
    const form = createForm(options);
    const field = createField({ form, name: 'name' });
    field.register(document.createElement('input'));
    field.change('Lin');
    field.setIssues({ error: [{ level: 'error', issue: { message: 'Manual' } }] });
    return { form, dispose };
  });
  dispose();
  expect(form.values.name).toBe('Lin');
  expect(form.field.issues('name').error[0].issue.message).toBe('Manual');
  expect(form.store.state.fields['~root.name'].ref).toBeNull();
});

it('should preserve a ref registered by another owner at the same path', () => {
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
