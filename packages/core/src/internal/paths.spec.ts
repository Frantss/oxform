import { describe, expect, it } from 'vite-plus/test';
import { isDeepEqual, joinPath } from './paths';

/** The input of one case, beside new data, so a case cannot see the writes of another. */
const setup = <const Input extends object>(input: Input) => ({
  ...input,
  data: { address: { city: 'Lisbon', zip: '1000' }, tags: ['a', 'b'], name: 'Ana', empty: null },
  [Symbol.dispose]() {},
});

describe('joinPath', () => {
  it('joins a prefix and a path with a dot', () => {
    using subject = setup({ prefix: 'address', path: 'city' });

    expect(joinPath(subject.prefix, subject.path)).toBe('address.city');
  });

  it('returns the path when the prefix is the root', () => {
    using subject = setup({ prefix: '', path: 'city' });

    expect(joinPath(subject.prefix, subject.path)).toBe('city');
  });

  it('returns the prefix when the path is the root', () => {
    using subject = setup({ prefix: 'address', path: '' });

    expect(joinPath(subject.prefix, subject.path)).toBe('address');
  });
});

describe('isDeepEqual', () => {
  it('compares values that are not objects with Object.is', () => {
    using subject = setup({
      pairs: [
        [1, 1],
        [Number.NaN, Number.NaN],
        [0, -0],
      ],
    });

    expect(subject.pairs.map(([left, right]) => isDeepEqual(left, right))).toEqual([true, true, false]);
  });

  it('holds for objects with equal keys and values', () => {
    using subject = setup({});

    expect(isDeepEqual(subject.data, structuredClone(subject.data))).toBe(true);
  });

  it('does not hold for objects with a different value', () => {
    using subject = setup({});

    expect(isDeepEqual(subject.data, { ...subject.data, address: { city: 'Porto', zip: '1000' } })).toBe(false);
  });

  it('does not hold for arrays of a different length', () => {
    using subject = setup({ left: [1, 2], right: [1, 2, 3] });

    expect(isDeepEqual(subject.left, subject.right)).toBe(false);
  });

  it('does not hold for an array and an object with the same keys', () => {
    using subject = setup({ left: ['a'], right: { 0: 'a' } });

    expect(isDeepEqual(subject.left, subject.right)).toBe(false);
  });

  it('does not hold for an object and a number', () => {
    using subject = setup({
      pairs: [
        [{}, 'a'],
        [null, {}],
      ],
    });

    expect(subject.pairs.map(([left, right]) => isDeepEqual(left, right))).toEqual([false, false]);
  });

  it('does not hold for undefined against a missing key', () => {
    using subject = setup({ left: { a: undefined }, right: { b: undefined } });

    expect(isDeepEqual(subject.left, subject.right)).toBe(false);
  });

  it('does not hold for an extra key', () => {
    using subject = setup({ left: { a: 1 }, right: { a: 1, b: 2 } });

    expect(isDeepEqual(subject.left, subject.right)).toBe(false);
  });

  it('holds for objects with no prototype', () => {
    using subject = setup({
      left: Object.assign(Object.create(null), { a: 1 }),
      right: Object.assign(Object.create(null), { a: 1 }),
    });

    expect(isDeepEqual(subject.left, subject.right)).toBe(true);
  });

  it('compares dates by their time', () => {
    using subject = setup({
      pairs: [
        [new Date(0), new Date(0)],
        [new Date(0), new Date(1)],
      ],
    });

    expect(subject.pairs.map(([left, right]) => isDeepEqual(left, right))).toEqual([true, false]);
  });

  it('holds for two invalid dates', () => {
    using subject = setup({ left: new Date(Number.NaN), right: new Date(Number.NaN) });

    expect(isDeepEqual(subject.left, subject.right)).toBe(true);
  });

  it('does not hold for a date and a plain object', () => {
    using subject = setup({ left: new Date(0), right: {} });

    expect(isDeepEqual(subject.left, subject.right)).toBe(false);
  });

  it('compares files by identity', () => {
    using subject = setup({ file: new File(['a'], 'a.txt'), copy: new File(['a'], 'a.txt') });

    expect([isDeepEqual(subject.file, subject.file), isDeepEqual(subject.file, subject.copy)]).toEqual([true, false]);
  });

  it('compares sets by their items', () => {
    using subject = setup({
      pairs: [
        [new Set([1, 2]), new Set([2, 1])],
        [new Set([1]), new Set([2])],
      ],
    });

    expect(subject.pairs.map(([left, right]) => isDeepEqual(left, right))).toEqual([true, false]);
  });

  it('does not hold for sets of a different size', () => {
    using subject = setup({ left: new Set([1]), right: new Set([1, 2]) });

    expect(isDeepEqual(subject.left, subject.right)).toBe(false);
  });

  it('compares maps by their keys and deep values', () => {
    using subject = setup({
      pairs: [
        [new Map([['a', { b: 1 }]]), new Map([['a', { b: 1 }]])],
        [new Map([['a', 1]]), new Map([['b', 1]])],
        [new Map([['a', 1]]), new Map([['a', 2]])],
        [new Map([['a', 1]]), new Map()],
      ],
    });

    expect(subject.pairs.map(([left, right]) => isDeepEqual(left, right))).toEqual([true, false, false, false]);
  });
});
