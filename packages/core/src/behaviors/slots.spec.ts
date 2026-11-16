import { expect, it } from 'vite-plus/test';
import { rootSlots } from './slots';

it('names the root slot group', () => {
  expect(rootSlots.name).toBe('rootSlots');
});
