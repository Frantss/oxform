import { describe, expect, it, vi } from 'vitest';
import { createEffect } from './effect';
import { createProfileForm, deferred } from './test-helpers';

describe('derived status in the store', () => {
  it('holds the full status shape, with an entry for every node of the values', () => {
    const form = createProfileForm();
    const { status } = form.store.state;

    expect(Object.keys(status.form).sort()).toEqual([
      'blurred',
      'dirty',
      'pristine',
      'submits',
      'submitted',
      'submitting',
      'successful',
      'touched',
      'valid',
      'validating',
    ]);
    expect(Object.keys(status.fields).sort()).toEqual(['address', 'address.city', 'name', 'tags', 'tags.0', 'tags.1', 'tags.2']);
    expect(status.fields.name).toEqual({
      dirty: false,
      pristine: true,
      touched: false,
      blurred: false,
      valid: true,
      default: true,
    });
  });

  it('does not leak the raw flags that feed it', () => {
    const form = createProfileForm();

    expect(form.store.state.status).not.toHaveProperty('generation');
    expect(Object.keys(form.store.state.status).sort()).toEqual(['fields', 'form']);
  });

  it('is what status.form and status.at read', () => {
    const form = createProfileForm();
    form.events.change('name', 'Ada');

    expect(form.status.form).toBe(form.store.state.status.form);
    expect(form.status.at('name')).toBe(form.store.state.status.fields.name);
  });

  it('derives valid from the check issues, per field and for the form', () => {
    const form = createProfileForm();

    form.error.set('name', [{ message: 'Required' }]);
    expect(form.store.state.status.fields.name!.valid).toBe(false);
    expect(form.store.state.status.fields['address.city']!.valid).toBe(true);
    expect(form.store.state.status.form.valid).toBe(false);

    form.error.clear();
    expect(form.store.state.status.fields.name!.valid).toBe(true);
    expect(form.store.state.status.form.valid).toBe(true);
  });

  it('derives default from the values, while dirty stays', () => {
    const form = createProfileForm();

    form.events.change('name', 'x');
    expect(form.store.state.status.fields.name).toMatchObject({ dirty: true, default: false });

    form.events.change('name', '');
    expect(form.store.state.status.fields.name).toMatchObject({ dirty: true, default: true });
    expect(form.store.state.status.fields.address!.default).toBe(true);
  });

  it('follows arrays: items gain and lose entries, and status moves with them', () => {
    const form = createProfileForm();

    form.arrays.append('tags', 'd');
    expect(form.store.state.status.fields).toHaveProperty(['tags.3']);

    form.events.change('tags.0', 'x');
    form.arrays.swap('tags', 0, 3);
    expect(form.store.state.status.fields['tags.3']!.dirty).toBe(true);
    expect(form.store.state.status.fields['tags.0']!.dirty).toBe(false);

    form.arrays.remove('tags', 3);
    expect(form.store.state.status.fields).not.toHaveProperty(['tags.3']);
  });

  it('reports validating while a run is pending, in the state', async () => {
    const gate = deferred();
    const form = createProfileForm({ error: { blur: gate.schema } });

    const run = form.validation.run(undefined, { type: 'blur' });
    expect(form.store.state.status.form.validating).toBe(true);
    gate.release();
    await run;

    expect(form.store.state.status.form.validating).toBe(false);
  });

  it('shows reset and submit state', async () => {
    const form = createProfileForm({ onSubmit: () => undefined });
    form.events.change('name', 'x');

    await form.submit.run();
    expect(form.store.state.status.form).toMatchObject({ submits: 1, submitted: true, successful: true, dirty: true });

    form.reset.all();
    expect(form.store.state.status.form).toMatchObject({ submits: 0, dirty: false, successful: null });
    expect(form.store.state.status.fields.name!.dirty).toBe(false);
  });
});

describe('selectors and effects on status', () => {
  it('fire when form validity changes', () => {
    const form = createProfileForm();
    const effect = vi.fn();
    createEffect(form, state => state.status.form.valid, effect);

    form.error.set('name', [{ message: 'Required' }]);
    form.error.clear();

    expect(effect.mock.calls.map(([valid]) => valid)).toEqual([false, true]);
  });

  it('fire when a field becomes dirty, and not for an unrelated field', () => {
    const form = createProfileForm();
    const effect = vi.fn();
    createEffect(form, state => state.status.fields.name!.dirty, effect);

    form.events.change('address.city', 'Paris');
    expect(effect).not.toHaveBeenCalled();

    form.events.change('name', 'Ada');
    expect(effect).toHaveBeenCalledOnce();
    expect(effect).toHaveBeenCalledWith(true);
  });
});

describe('memoization per path', () => {
  it('keeps the status object of an unaffected field when another field changes', () => {
    const form = createProfileForm();
    const before = form.store.state.status;

    form.events.change('name', 'Ada');
    const after = form.store.state.status;

    expect(after.fields['address.city']).toBe(before.fields['address.city']);
    expect(after.fields['tags.0']).toBe(before.fields['tags.0']);
    expect(after.fields.name).not.toBe(before.fields.name);
    expect(after.fields).not.toBe(before.fields);
  });

  it('keeps the whole status when a change leaves every flag as it was', () => {
    const form = createProfileForm();
    form.events.change('name', 'x');
    const before = form.store.state.status;

    form.values.set('tags.0', 'a');

    expect(form.store.state.status).toEqual(before);
    expect(form.store.state.status.fields.name).toBe(before.fields.name);
  });

  it('keeps the same state object across subscribe cycles, as an adapter does in strict mode', () => {
    const form = createProfileForm();
    form.events.change('name', 'x');
    const subscription = form.store.subscribe(() => {});
    const whileSubscribed = form.store.state;
    subscription.unsubscribe();

    expect(form.store.state).toBe(whileSubscribed);
  });
});
