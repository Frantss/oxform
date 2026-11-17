import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { App } from '../src/app';
import { setup } from './setup';

describe('App', () => {
  it('lists the five domain forms and shows the chosen one', async () => {
    using screen = setup(() => <App />);
    const nav = screen.getByRole('navigation', { name: 'Examples' });
    await userEvent.click(nav.getByRole('button', { name: 'Team invites' }));

    expect(
      nav
        .getByRole('button')
        .all()
        .map(button => button.element().textContent),
    ).toEqual(['Sign-in', 'Checkout', 'Team invites', 'Article editor', 'Member filter']);
    await expect.element(screen.getByRole('form', { name: 'Team invites' })).toBeVisible();
  });
});
