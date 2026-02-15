import { fields_build, fields_delete, fields_reset, fields_root, fields_set, fields_shift } from '#utils/fields';
import { generateId } from '#utils/generate-id';
import { describe, expect, it, vi } from 'vitest';

vi.mock('#utils/generate-id', { spy: true });

const setup = (overrides?: { values?: unknown; id?: string }) => {
  const values = {
    object: {
      string: 'string',
      number: 12,
      boolean: true,
    },
    array: [1, 2, 3],
    complex: [{ array: { string: 'string' } }],
  };

  if (overrides?.id) vi.mocked(generateId).mockReturnValue(overrides.id);

  const fields = fields_build(overrides?.values ?? values);

  return {
    fields,
    values,
  };
};

describe('fields_build', () => {
  it('should create an entry for each path', () => {
    const { fields } = setup();

    expect(Object.keys(fields)).toStrictEqual([
      fields_root,
      `${fields_root}.object`,
      `${fields_root}.object.string`,
      `${fields_root}.object.number`,
      `${fields_root}.object.boolean`,
      `${fields_root}.array`,
      `${fields_root}.array.0`,
      `${fields_root}.array.1`,
      `${fields_root}.array.2`,
      `${fields_root}.complex`,
      `${fields_root}.complex.0`,
      `${fields_root}.complex.0.array`,
      `${fields_root}.complex.0.array.string`,
    ]);
  });

  it('should create the correct fields map', () => {
    const { fields } = setup();
    const entry = fields[`${fields_root}.object`];

    expect(entry.id).toBeDefined();
    expect(entry.meta.blurred).toBe(false);
    expect(entry.meta.dirty).toBe(false);
    expect(entry.meta.touched).toBe(false);
    expect(entry.errors).toStrictEqual([]);
    expect(entry.ref).toBeNull();
  });
});

describe('fields_set', () => {
  it('should update the specific path', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'object', { meta: { blurred: true, touched: true } });

    expect(updated[`${fields_root}.object`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.object`].meta.touched).toBe(true);
    expect(updated[`${fields_root}.object`].meta.blurred).toBe(true);
  });

  it('should update the all ascendent paths', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'complex.0.array.string', { meta: { blurred: true, touched: true } });

    expect(updated[`${fields_root}.complex.0.array.string`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].meta.touched).toBe(true);
    expect(updated[`${fields_root}.complex.0.array.string`].meta.blurred).toBe(true);

    expect(updated[`${fields_root}.complex.0.array`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].meta.touched).toBe(true);
    expect(updated[`${fields_root}.complex.0.array`].meta.blurred).toBe(true);

    expect(updated[`${fields_root}.complex.0.array`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].meta.touched).toBe(true);
    expect(updated[`${fields_root}.complex.0.array`].meta.blurred).toBe(true);

    expect(updated[`${fields_root}.complex`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex`].meta.touched).toBe(true);
    expect(updated[`${fields_root}.complex`].meta.blurred).toBe(true);
  });

  it('should update the descendant paths', () => {
    const { fields } = setup();

    const updated = fields_set(fields, 'complex', { meta: { blurred: true, touched: true } });

    expect(updated[`${fields_root}.complex.0.array.string`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].meta.touched).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].meta.blurred).toBe(false);

    expect(updated[`${fields_root}.complex.0.array`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].meta.touched).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].meta.blurred).toBe(false);

    expect(updated[`${fields_root}.complex.0.array`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].meta.touched).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].meta.blurred).toBe(false);

    expect(updated[`${fields_root}.complex`].meta.dirty).toBe(false);
    expect(updated[`${fields_root}.complex`].meta.touched).toBe(true);
    expect(updated[`${fields_root}.complex`].meta.blurred).toBe(true);
  });
});

describe('fields_delete', () => {
  it('should specified path', () => {
    const { fields } = setup();

    const updated = fields_delete(fields, 'object');

    expect(updated[`${fields_root}.object`]).not.toBeDefined();
  });

  it('should all descendant paths', () => {
    const { fields } = setup();

    const updated = fields_delete(fields, 'complex');

    expect(updated[`${fields_root}.complex`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0.array`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0.array.string`]).not.toBeDefined();
  });

  it('should not delete ascendant paths', () => {
    const { fields } = setup();

    const updated = fields_delete(fields, 'complex.0.array');

    expect(updated[`${fields_root}.complex`]).toBeDefined();
    expect(updated[`${fields_root}.complex.0`]).toBeDefined();
    expect(updated[`${fields_root}.complex.0.array`]).not.toBeDefined();
    expect(updated[`${fields_root}.complex.0.array.string`]).not.toBeDefined();
  });

  it('should delete unrelated paths', () => {
    const { fields } = setup();
    const updated = fields_delete(fields, 'object.boolean');
    const numberOfEntries = Object.keys(updated).length;

    expect(numberOfEntries).toBe(12);
  });
});

describe('fields_reset', () => {
  it('should reset path', () => {
    const { fields, values } = setup();

    const set = fields_set(fields, 'object', { meta: { blurred: true } });
    const updated = fields_reset(set, 'object', values);

    expect(updated[`${fields_root}.object`].meta.blurred).toBe(false);
  });

  it('should reset descendant paths', () => {
    const { fields, values } = setup();

    const set = fields_set(fields, 'complex', { meta: { blurred: true } });
    const updated = fields_reset(set, 'complex', values);

    expect(updated[`${fields_root}.complex`].meta.blurred).toBe(false);
    expect(updated[`${fields_root}.complex.0`].meta.blurred).toBe(false);
    expect(updated[`${fields_root}.complex.0.array`].meta.blurred).toBe(false);
    expect(updated[`${fields_root}.complex.0.array.string`].meta.blurred).toBe(false);
  });

  it('should reset meta shape', () => {
    const { fields, values } = setup();

    const updated = fields_reset(fields, 'object', { ...values, object: { new: { nested: ['string'] } } });

    expect(updated[`${fields_root}.object`]).toBeDefined();
    expect(updated[`${fields_root}.object.new`]).toBeDefined();
    expect(updated[`${fields_root}.object.new.nested`]).toBeDefined();
    expect(updated[`${fields_root}.object.new.nested.0`]).toBeDefined();

    expect(updated[`${fields_root}.object.string`]).not.toBeDefined();
    expect(updated[`${fields_root}.object.number`]).not.toBeDefined();
    expect(updated[`${fields_root}.object.boolean`]).not.toBeDefined();
  });
});

describe('fields_shift', () => {
  it('should correctly shift meta to left', () => {
    const { fields } = setup();

    const updated = fields_shift(fields, 'array', 2, 'left');

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.2`]).not.toBeDefined();
  });

  it('should correctly shift multiple meta to left', () => {
    const { fields } = setup({ values: { array: [1, 2, 3, 4, 5, 6, 7] } });

    const updated = fields_shift(fields, 'array', 4, 'left');

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.3`]).toStrictEqual(fields[`${fields_root}.array.4`]);
    expect(updated[`${fields_root}.array.4`]).toStrictEqual(fields[`${fields_root}.array.5`]);
    expect(updated[`${fields_root}.array.5`]).toStrictEqual(fields[`${fields_root}.array.6`]);
    expect(updated[`${fields_root}.array.6`]).toStrictEqual(fields[`${fields_root}.array.7`]);
    expect(updated[`${fields_root}.array.7`]).not.toBeDefined();
  });

  it('should correctly shift meta to right', () => {
    const { fields } = setup();

    const updated = fields_shift(fields, 'array', 1, 'right');

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).not.toBeDefined();
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.3`]).toStrictEqual(fields[`${fields_root}.array.2`]);
  });

  it('should correctly shift multiple meta to right', () => {
    const { fields } = setup({ values: { array: [1, 2, 3, 4, 5, 6, 7] } });

    const updated = fields_shift(fields, 'array', 4, 'right');

    expect(updated[`${fields_root}.array.0`]).toStrictEqual(fields[`${fields_root}.array.0`]);
    expect(updated[`${fields_root}.array.1`]).toStrictEqual(fields[`${fields_root}.array.1`]);
    expect(updated[`${fields_root}.array.2`]).toStrictEqual(fields[`${fields_root}.array.2`]);
    expect(updated[`${fields_root}.array.3`]).toStrictEqual(fields[`${fields_root}.array.3`]);
    expect(updated[`${fields_root}.array.4`]).not.toBeDefined();
    expect(updated[`${fields_root}.array.5`]).toStrictEqual(fields[`${fields_root}.array.4`]);
    expect(updated[`${fields_root}.array.6`]).toStrictEqual(fields[`${fields_root}.array.5`]);
    expect(updated[`${fields_root}.array.7`]).toStrictEqual(fields[`${fields_root}.array.6`]);

    expect(updated[`${fields_root}.array.8`]).not.toBeDefined();
  });
});
