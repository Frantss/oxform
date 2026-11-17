import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { MemberFilter } from '../src/examples/member-filter';
import { setup } from './setup';

describe('MemberFilter', () => {
  it('filters the list as the user types, and renders no form element', async () => {
    using screen = setup(() => <MemberFilter />);
    await userEvent.fill(screen.getByRole('searchbox', { name: 'Search' }), 'grace');

    await expect.element(screen.getByRole('list', { name: 'Members' })).toHaveTextContent('Grace Hopper (member)');
    expect([screen.getByRole('listitem').all().length, screen.container.querySelector('form')]).toEqual([1, null]);
  });

  it('shows "Clear filters" while a filter is set, and clears every filter', async () => {
    using screen = setup(() => <MemberFilter />);
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    await expect.element(clear).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'admin');
    await userEvent.click(clear);

    await expect.element(clear).not.toBeInTheDocument();
    expect(screen.getByRole('listitem').all().length).toBe(3);
  });
});
