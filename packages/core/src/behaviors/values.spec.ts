import { describe, expect, it, vi } from 'vite-plus/test';
import { adapterControlsOf, defineForm } from '#main/form';
import { schemaOf } from '../../tests/helpers';
import { values } from './values';

type Profile = { name: string; address: { city: string; zip: string }; tags: string[] };

const defaultValues: Profile = { name: 'a', address: { city: 'x', zip: '1' }, tags: ['t'] };

/** An instance of the shortest chain, `values` alone. */
const setup = (schema = schemaOf<Profile>()) => {
  const form = defineForm({ schema, defaultValues }).extend(values);
  const instance = form.create();

  return { form, instance, [Symbol.dispose]: () => instance.destroy() };
};

describe('values', () => {
  it('reads the whole object and a path', () => {
    using subject = setup();

    expect([subject.instance.values.get(), subject.instance.values.get('address.city'), subject.instance.values.get('tags.0')]).toEqual([
      defaultValues,
      'x',
      't',
    ]);
  });

  it('does not change the default values', () => {
    using subject = setup();
    subject.instance.values.set('address.city', 'y');

    expect(defaultValues.address.city).toBe('x');
  });

  it('writes with an updater of the current value', () => {
    using subject = setup();
    subject.instance.values.set('name', current => `${current}b`);

    expect(subject.instance.values.get('name')).toBe('ab');
  });

  it('returns true for a write and false for an equal value, and notifies only for the write', () => {
    using subject = setup();
    const listener = vi.fn();
    subject.instance.values.onChange(listener);

    expect([subject.instance.values.set('name', 'b'), subject.instance.values.set('name', 'b'), listener.mock.calls.length]).toEqual([
      true,
      false,
      1,
    ]);
  });

  it('runs the interceptors before the write', () => {
    using subject = setup();
    subject.instance.values.intercept(change => ({ ...change, value: String(change.value).toUpperCase() }));
    subject.instance.values.set('name', 'ok');

    expect(subject.instance.values.get('name')).toBe('OK');
  });

  it('refuses a canceled change', () => {
    using subject = setup();
    subject.instance.values.intercept((_change, details) => details.cancel());

    expect([subject.instance.values.set('name', 'b'), subject.instance.values.get('name')]).toEqual([false, 'a']);
  });

  it('passes the reason to the listeners', () => {
    using subject = setup();
    const listener = vi.fn();
    subject.instance.values.onChange((change, details) => listener(change, details.reason));
    subject.instance.values.set('name', 'b', { reason: 'input' });

    expect(listener).toHaveBeenCalledWith({ path: 'name', value: 'b' }, 'input');
  });

  it('keeps the values of two instances apart, with their hooks', () => {
    using first = setup();
    using second = setup();
    const listener = vi.fn();
    second.instance.values.onChange(listener);
    first.instance.values.set('name', 'b');

    expect([second.instance.values.get('name'), listener.mock.calls.length]).toEqual(['a', 0]);
  });

  it('starts the store from the defaultValues option of create', () => {
    using subject = setup();
    const other = subject.form.create({ defaultValues: { ...defaultValues, name: 'z' } });
    const name = other.values.get('name');
    other.destroy();

    expect(name).toBe('z');
  });

  it('keeps the values when a later defaultValues option arrives', () => {
    using subject = setup();
    adapterControlsOf(subject.instance).setOptions({ defaultValues: { ...defaultValues, name: 'z' } });

    expect(subject.instance.values.get('name')).toBe('a');
  });

  it('does not run the schema, so a schema transformation never replaces the values', () => {
    const validate = vi.fn(() => ({ value: { ...defaultValues, name: 'transformed' } }));
    using subject = setup({ '~standard': { version: 1, vendor: 'test', validate } });
    subject.instance.values.set('name', 'b');

    expect([subject.instance.values.get('name'), validate.mock.calls.length]).toEqual(['b', 0]);
  });
});
