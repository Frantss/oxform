import { slotsOf } from '@oxform/core/adapter';
import { expect, it } from 'vite-plus/test';
import { fixtures } from './fixtures';

it('makes a form with no extension', () => {
  expect(slotsOf(fixtures.empty())).toEqual([]);
});
