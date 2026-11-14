import { describe, expect, it } from 'vitest';
import { statusInternals } from './status';
import { createProfileForm, defaultProfile, failing, fakeElement } from './test-helpers';

describe('status and events', () => {
  it('marks a changed field and its ancestors dirty and touched, and no sibling', () => {
    const form = createProfileForm();

    form.events.change('address.city', 'Paris');

    expect(form.status.at('address.city')).toMatchObject({ dirty: true, touched: true, pristine: false });
    expect(form.status.at('address' as never)).toMatchObject({ dirty: true, touched: true });
    expect(form.status.at('name')).toMatchObject({ dirty: false, touched: false, pristine: true });
    expect(form.status.form).toMatchObject({ dirty: true, pristine: false, touched: true, blurred: false });
  });

  it('keeps dirty or touched flags off when should says so', () => {
    const form = createProfileForm();

    form.events.change('name', 'a', { should: { dirty: false, touch: false } });

    expect(form.status.at('name')).toMatchObject({ dirty: false, touched: false });
    expect(form.values.get('name')).toBe('a');
  });

  it('does not mark a refused change', () => {
    const form = createProfileForm();
    form.values.intercept((_, details) => details.cancel());

    form.events.change('name', 'a');

    expect(form.status.at('name').dirty).toBe(false);
  });

  it('marks touched on focus and blurred on blur, and drives the registered element', () => {
    const form = createProfileForm();
    const { calls, element } = fakeElement();
    form.events.register('name')(null);
    form.events.register('name')(element);

    form.events.focus('name');
    form.events.blur('name');

    expect(calls).toEqual(['focus', 'blur']);
    expect(form.status.at('name')).toMatchObject({ touched: true, blurred: true });
    form.events.unregister('name');
    expect(form.field('name').state.ref).toBeNull();
  });

  it('keeps dirty after a value returns to its default, while default is true', () => {
    const form = createProfileForm();

    form.events.change('name', 'x');
    expect(form.status.at('name').default).toBe(false);
    form.events.change('name', '');

    expect(form.status.at('name')).toMatchObject({ dirty: true, default: true });
  });

  it('requests change validation only when a validator exists, unless should.validate decides', async () => {
    const without = createProfileForm();
    without.events.change('name', 'a');
    expect(without.error.at('name')).toEqual([]);

    const withValidator = createProfileForm({ error: { change: failing({ message: 'Bad', path: ['name'] }) } });
    withValidator.events.change('name', 'a', { should: { validate: false } });
    await Promise.resolve();
    expect(withValidator.error.at('name')).toEqual([]);

    withValidator.events.change('name', 'b');
    await new Promise(resolve => setTimeout(resolve));
    expect(withValidator.error.at('name')).toHaveLength(1);
  });

  it('reads field valid from its own path and form valid from every path', () => {
    const form = createProfileForm();
    form.error.set('name', [{ message: 'Bad' }]);

    expect(form.status.at('name').valid).toBe(false);
    expect(form.status.at('address.city').valid).toBe(true);
    expect(form.status.form.valid).toBe(false);
  });

  it('applies default status, with a path override over the wildcard', () => {
    const form = createProfileForm({
      defaultStatus: { submits: 2, successful: true },
      defaultFieldStatus: { '*': { touched: true }, name: { touched: false, dirty: true } },
    });

    expect(form.status.at('address.city').touched).toBe(true);
    expect(form.status.at('name')).toMatchObject({ touched: false, dirty: true });
    expect(form.status.form).toMatchObject({ submits: 2, submitted: true, successful: true });
  });

  it('reports validating while a run is pending', async () => {
    const { deferred } = await import('./test-helpers');
    const gate = deferred();
    const form = createProfileForm({ error: { blur: gate.schema } });

    const run = form.validation.run('name', { type: 'blur' });
    expect(form.status.form.validating).toBe(true);
    gate.release();
    await run;

    expect(form.status.form.validating).toBe(false);
  });
});

describe('reset', () => {
  it('restores default values, field state, issues and form status', () => {
    const form = createProfileForm();
    form.events.change('name', 'x');
    form.error.set('name', [{ message: 'Bad' }]);
    statusInternals(form.status).setForm({ submits: 3 });

    form.reset.all();

    expect(form.values.get()).toEqual(defaultProfile);
    expect(form.status.at('name').dirty).toBe(false);
    expect(form.error.at('name')).toEqual([]);
    expect(form.status.form.submits).toBe(0);
  });

  it('uses supplied values without changing the defaults, and a status override', () => {
    const form = createProfileForm();

    form.reset.all({ values: { ...defaultProfile, name: 'custom' }, status: { submits: 5 } });
    expect(form.values.get('name')).toBe('custom');
    expect(form.status.form.submits).toBe(5);

    form.reset.all();
    expect(form.values.get('name')).toBe('');
  });

  it('keeps selected checks, or every field state with keep.fields', () => {
    const form = createProfileForm();
    form.events.change('name', 'x');
    form.error.set('name', [{ message: 'Bad' }]);

    form.reset.all({ keep: { checks: ['error'] } });
    expect(form.error.at('name')).toHaveLength(1);
    expect(form.status.at('name').dirty).toBe(false);

    form.events.change('name', 'y');
    form.reset.all({ keep: { fields: true } });
    expect(form.status.at('name').dirty).toBe(true);
    expect(form.error.at('name')).toHaveLength(1);
  });

  it('resets one path to its default or a given value, with its subtree, and keeps siblings', () => {
    const form = createProfileForm();
    form.events.change('address.city', 'Paris');
    form.events.change('name', 'x');
    form.error.set('address.city', [{ message: 'Bad' }]);

    form.reset.at('address' as never);

    expect(form.values.get('address.city')).toBe('');
    expect(form.status.at('address.city').dirty).toBe(false);
    expect(form.error.at('address.city')).toEqual([]);
    expect(form.values.get('name')).toBe('x');
    expect(form.status.at('name').dirty).toBe(true);

    form.reset.at('name', { value: 'given' });
    expect(form.values.get('name')).toBe('given');
  });

  it('discards a pending validation run', async () => {
    const { deferred } = await import('./test-helpers');
    const gate = deferred([{ message: 'Bad', path: ['name'] }]);
    const form = createProfileForm({ error: { blur: gate.schema } });

    const run = form.validation.run(undefined, { type: 'blur' });
    form.reset.all({ values: { ...defaultProfile, name: 'other' } });
    gate.release();

    expect(await run).toEqual([true, {}]);
    expect(form.error.at('name')).toEqual([]);
  });
});

describe('handles', () => {
  it('exposes field state and operations bound to a path', () => {
    const form = createProfileForm();
    const name = form.field('name');

    name.change('Ada');

    expect(name.get()).toBe('Ada');
    expect(name.state).toMatchObject({ id: 'profile-name', value: 'Ada', defaultValue: '', ref: null });
    expect(name.state.status.dirty).toBe(true);
    name.reset();
    expect(name.get()).toBe('');
  });

  it('exposes check sugar for the checks it was given', () => {
    const form = createProfileForm();
    const name = form.field('name');

    name.setError([{ message: 'Taken' }]);

    expect(name.error()).toEqual([{ message: 'Taken' }]);
    expect(form.error.at('name')).toEqual([{ message: 'Taken' }]);
  });

  it('scopes handles to a sub-object, at any depth', () => {
    const form = createProfileForm();
    const address = form.scope('address');

    address.field('city').change('Paris');

    expect(form.values.get('address.city')).toBe('Paris');
    expect(form.status.at('address.city').dirty).toBe(true);
  });

  it('exposes an array handle with ids that follow the items', () => {
    const form = createProfileForm();
    const tags = form.array('tags');
    const [first, second, third] = tags.ids;

    tags.swap(0, 2);

    expect(tags.get()).toEqual(['c', 'b', 'a']);
    expect(tags.ids).toEqual([third, second, first]);
  });
});
