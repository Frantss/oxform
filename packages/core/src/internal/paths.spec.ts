import { describe, expect, it } from 'vite-plus/test';
import { joinPath } from './paths';

describe('joinPath', () => {
  it('joins a prefix and a path with a dot', () => {
    expect(joinPath('address', 'city')).toBe('address.city');
  });

  it('returns the path when the prefix is empty', () => {
    expect(joinPath('', 'city')).toBe('city');
  });

  it('returns the prefix when the path is empty', () => {
    expect(joinPath('address', '')).toBe('address');
  });
});
