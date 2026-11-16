import { describe, expect, it } from 'vite-plus/test';
import { ancestorsOf, getAt, isDeepEqual, isWithin, joinPath, segments, setAt } from './paths';

describe('segments', () => {
  it('splits a dotted path into its keys', () => {
    expect(segments('tags.0.name')).toEqual(['tags', '0', 'name']);
  });

  it('gives no key for the root', () => {
    expect(segments('')).toEqual([]);
  });
});

describe('getAt', () => {
  const data = { address: { city: 'Lisbon' }, tags: ['a', 'b'], empty: null };

  it('reads a nested key', () => {
    expect(getAt(data, 'address.city')).toBe('Lisbon');
  });

  it('reads an array index', () => {
    expect(getAt(data, 'tags.1')).toBe('b');
  });

  it('reads the whole value at the root', () => {
    expect(getAt(data, '')).toBe(data);
  });

  it('gives undefined below a missing key', () => {
    expect(getAt(data, 'phone.number')).toBeUndefined();
  });

  it('gives undefined below null', () => {
    expect(getAt(data, 'empty.key')).toBeUndefined();
  });
});

describe('setAt', () => {
  const data = { address: { city: 'Lisbon', zip: '1000' }, tags: ['a', 'b'], name: 'Ana' };

  it('writes a nested key', () => {
    expect(setAt(data, 'address.city', 'Porto')).toEqual({ ...data, address: { city: 'Porto', zip: '1000' } });
  });

  it('gives new references to the ancestors of the path', () => {
    const written = setAt(data, 'address.city', 'Porto');

    expect([written === data, written.address === data.address]).toEqual([false, false]);
  });

  it('keeps the references of the siblings', () => {
    expect(setAt(data, 'address.city', 'Porto').tags).toBe(data.tags);
  });

  it('does not change the original value', () => {
    setAt(data, 'address.city', 'Porto');

    expect(data.address.city).toBe('Lisbon');
  });

  it('writes an array item and keeps an array', () => {
    expect(setAt(data, 'tags.1', 'c').tags).toEqual(['a', 'c']);
  });

  it('makes the missing ancestors as objects', () => {
    expect(setAt({}, 'address.city', 'Porto')).toEqual({ address: { city: 'Porto' } });
  });

  it('replaces the whole value at the root', () => {
    expect(setAt(data, '', 'value')).toBe('value');
  });
});

describe('joinPath', () => {
  it('joins a prefix and a path with a dot', () => {
    expect(joinPath('address', 'city')).toBe('address.city');
  });

  it('returns the path when the prefix is the root', () => {
    expect(joinPath('', 'city')).toBe('city');
  });

  it('returns the prefix when the path is the root', () => {
    expect(joinPath('address', '')).toBe('address');
  });
});

describe('ancestorsOf', () => {
  it('lists each ancestor, nearest first, then the root', () => {
    expect(ancestorsOf('a.b.c')).toEqual(['a.b', 'a', '']);
  });

  it('gives no ancestor for the root', () => {
    expect(ancestorsOf('')).toEqual([]);
  });
});

describe('isWithin', () => {
  it('holds for the same path', () => {
    expect(isWithin('address', 'address')).toBe(true);
  });

  it('holds for a descendant', () => {
    expect(isWithin('address.city', 'address')).toBe(true);
  });

  it('does not hold for an ancestor', () => {
    expect(isWithin('address', 'address.city')).toBe(false);
  });

  it('does not hold for a sibling', () => {
    expect(isWithin('name', 'address')).toBe(false);
  });

  it('does not hold for a key that starts with the prefix key', () => {
    expect(isWithin('addressLine', 'address')).toBe(false);
  });

  it('holds for every path within the root', () => {
    expect(isWithin('address.city', '')).toBe(true);
  });
});

describe('isDeepEqual', () => {
  it('compares primitives with Object.is', () => {
    expect([isDeepEqual(1, 1), isDeepEqual(Number.NaN, Number.NaN), isDeepEqual(0, -0)]).toEqual([true, true, false]);
  });

  it('holds for objects with equal keys and values', () => {
    expect(isDeepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true);
  });

  it('does not hold for objects with a different value', () => {
    expect(isDeepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  it('does not hold for arrays of a different length', () => {
    expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('does not hold for an array and an object with the same keys', () => {
    expect(isDeepEqual(['a'], { 0: 'a' })).toBe(false);
  });

  it('does not hold for an object and a primitive', () => {
    expect([isDeepEqual({}, 'a'), isDeepEqual(null, {})]).toEqual([false, false]);
  });

  it('does not hold for undefined against a missing key', () => {
    expect(isDeepEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it('does not hold for an extra key', () => {
    expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('holds for objects with no prototype', () => {
    expect(isDeepEqual(Object.assign(Object.create(null), { a: 1 }), Object.assign(Object.create(null), { a: 1 }))).toBe(true);
  });

  it('compares dates by their time', () => {
    expect([isDeepEqual(new Date(0), new Date(0)), isDeepEqual(new Date(0), new Date(1))]).toEqual([true, false]);
  });

  it('holds for two invalid dates', () => {
    expect(isDeepEqual(new Date(Number.NaN), new Date(Number.NaN))).toBe(true);
  });

  it('does not hold for a date and a plain object', () => {
    expect(isDeepEqual(new Date(0), {})).toBe(false);
  });

  it('compares files by identity', () => {
    const file = new File(['a'], 'a.txt');

    expect([isDeepEqual(file, file), isDeepEqual(file, new File(['a'], 'a.txt'))]).toEqual([true, false]);
  });

  it('compares sets by their items', () => {
    expect([isDeepEqual(new Set([1, 2]), new Set([2, 1])), isDeepEqual(new Set([1]), new Set([2]))]).toEqual([true, false]);
  });

  it('does not hold for sets of a different size', () => {
    expect(isDeepEqual(new Set([1]), new Set([1, 2]))).toBe(false);
  });

  it('compares maps by their keys and deep values', () => {
    expect([
      isDeepEqual(new Map([['a', { b: 1 }]]), new Map([['a', { b: 1 }]])),
      isDeepEqual(new Map([['a', 1]]), new Map([['b', 1]])),
      isDeepEqual(new Map([['a', 1]]), new Map([['a', 2]])),
      isDeepEqual(new Map([['a', 1]]), new Map()),
    ]).toEqual([true, false, false, false]);
  });
});
