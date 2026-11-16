import { expect, it } from 'vite-plus/test';
import { libraries } from './libraries';

it('compares Oxform with three form libraries', () => {
  expect(libraries).toEqual(['oxform', 'tanstack-form', 'react-hook-form', 'formisch']);
});
