import { describe, expect, it, vi } from 'vitest';
import { defineForm } from './form';
import { schemaOf } from './test-helpers';
import { values as valuesExtension } from './values';

type Values = { name: string; address: { city: string; zip: string }; tags: string[] };

const defaultValues: Values = { name: 'a', address: { city: 'x', zip: '1' }, tags: ['t'] };

const setup = () => defineForm({ schema: schemaOf<Values>(), defaultValues }).extend(valuesExtension).create().values;

describe('values', () => {
  it('reads the whole object and a path', () => {
    const values = setup();

    expect(values.get()).toEqual(defaultValues);
    expect(values.get('address.city')).toBe('x');
    expect(values.get('tags.0')).toBe('t');
  });

  it('changes only the given path and keeps sibling references', () => {
    const values = setup();
    const before = values.get();

    expect(values.set('address.city', 'y')).toBe(true);
    expect(values.get('address')).toEqual({ city: 'y', zip: '1' });
    expect(values.get().tags).toBe(before.tags);
    expect(defaultValues.address.city).toBe('x');
  });

  it('accepts an updater function', () => {
    const values = setup();

    values.set('name', current => `${current}b`);
    expect(values.get('name')).toBe('ab');
  });

  it('writes array items by index', () => {
    const values = setup();

    values.set('tags.0', 'u');
    expect(values.get('tags')).toEqual(['u']);
  });

  it('returns false and does not notify for an equal value', () => {
    const values = setup();
    const listener = vi.fn();
    values.onChange(listener);

    expect(values.set('name', 'a')).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('runs interceptors before the write and refuses a canceled change', () => {
    const values = setup();
    values.intercept((change, details) => {
      if (change.value === 'bad') details.cancel();
      else return { ...change, value: String(change.value).toUpperCase() };
    });

    expect(values.set('name', 'bad')).toBe(false);
    expect(values.get('name')).toBe('a');
    values.set('name', 'ok');
    expect(values.get('name')).toBe('OK');
  });

  it('starts the store from `defaultValues`, and takes a later `defaultValues` option', () => {
    const form = defineForm({ schema: schemaOf<Values>(), defaultValues }).extend(valuesExtension);

    expect(form.create().store.state).toEqual({ values: defaultValues });
    expect(form.create({ defaultValues: { ...defaultValues, name: 'z' } }).values.get('name')).toBe('z');
  });
});
