import { expect, it } from 'vite-plus/test';
import { rootSlots } from './slots';

const setup = () => ({ slots: rootSlots(definition => definition as never), [Symbol.dispose]() {} });

it('gives the root part a form element', () => {
  using group = setup();

  expect(group.slots).toEqual({ root: { element: 'form' } });
});
