import { describe, expect, it } from 'vite-plus/test';
import { get, idPart } from './path';

/** The input of one case, beside new values to read. */
const setup = <const Input extends object>(input: Input) => ({
  ...input,
  values: { address: { city: 'Lisbon' }, tags: ['a', 'b'] },
  [Symbol.dispose]() {},
});

describe('get', () => {
  it('reads a path from plain state', () => {
    using subject = setup({ at: 'address.city' });

    expect(get(subject.values, subject.at)).toBe('Lisbon');
  });

  it('gives undefined for a missing array item', () => {
    using subject = setup({ at: 'tags.5' });

    expect(get(subject.values, subject.at)).toBeUndefined();
  });
});

describe('idPart', () => {
  it('keeps letters and digits', () => {
    using subject = setup({ path: 'address2' });

    expect(idPart(subject.path)).toBe('address2');
  });

  it('writes a dot as a hyphen', () => {
    using subject = setup({ path: 'tags.0.name' });

    expect(idPart(subject.path)).toBe('tags-0-name');
  });

  it('escapes every other character with its code point', () => {
    using subject = setup({ path: 'a-b_c d' });

    expect(idPart(subject.path)).toBe('a_2d_b_5f_c_20_d');
  });

  it('escapes a character outside the basic plane once', () => {
    using subject = setup({ path: 'a😀' });

    expect(idPart(subject.path)).toBe('a_1f600_');
  });

  it('gives different parts for paths that differ only in punctuation', () => {
    using subject = setup({ paths: ['a.b', 'a-b', 'a_b', 'a b', 'a.2d.b', 'a_2d_b'] });

    expect(new Set(subject.paths.map(idPart)).size).toBe(subject.paths.length);
  });

  it('gives the same part for the same path', () => {
    using subject = setup({ path: 'address.city' });

    expect(idPart(subject.path)).toBe(idPart(subject.path));
  });
});
