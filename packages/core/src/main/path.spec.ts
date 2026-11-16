import { describe, expect, it } from 'vite-plus/test';
import { get, idPart } from './path';

describe('get', () => {
  const values = { address: { city: 'Lisbon' }, tags: ['a', 'b'] };

  it('reads a path from plain state', () => {
    expect(get(values, 'address.city')).toBe('Lisbon');
  });

  it('gives undefined for a missing array item', () => {
    expect(get(values, 'tags.5')).toBeUndefined();
  });
});

describe('idPart', () => {
  it('keeps letters and digits', () => {
    expect(idPart('address2')).toBe('address2');
  });

  it('writes a dot as a hyphen', () => {
    expect(idPart('tags.0.name')).toBe('tags-0-name');
  });

  it('escapes every other character with its code point', () => {
    expect(idPart('a-b_c d')).toBe('a_2d_b_5f_c_20_d');
  });

  it('escapes a character outside the basic plane once', () => {
    expect(idPart('a😀')).toBe('a_1f600_');
  });

  it('gives different parts for paths that differ only in punctuation', () => {
    const paths = ['a.b', 'a-b', 'a_b', 'a b', 'a.2d.b', 'a_2d_b'];

    expect(new Set(paths.map(idPart)).size).toBe(paths.length);
  });

  it('gives the same part for the same path', () => {
    expect(idPart('address.city')).toBe(idPart('address.city'));
  });
});
