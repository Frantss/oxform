import { expect, it } from 'vite-plus/test';
import { rootSlots } from './slots';

const setup = () => ({ group: rootSlots, [Symbol.dispose]() {} });

it('names the root slot group', () => {
  using subject = setup();

  expect(subject.group.name).toBe('rootSlots');
});
