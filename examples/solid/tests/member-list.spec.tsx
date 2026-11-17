import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { MemberList } from '../src/examples/member-list';
import { teamInvitesParts } from '../src/examples/team-invites-form';
import { setup } from './setup';

const { Root } = teamInvitesParts;

describe('MemberList', () => {
  it('adds, reorders and removes rows, and the value and the error stay with each row', async () => {
    using screen = setup(() => (
      <Root options={{ defaultValues: { team: 'Design', seats: 2, members: [] } }}>
        <MemberList />
      </Root>
    ));
    await userEvent.click(screen.getByRole('button', { name: 'Invite another' }));
    await userEvent.click(screen.getByRole('button', { name: 'Invite another' }));
    const emails = screen.getByRole('textbox', { name: 'Email' });
    await userEvent.fill(emails.nth(0), 'not an email');
    await userEvent.fill(emails.nth(1), 'grace@example.com');
    await expect.element(emails.nth(0)).toHaveAccessibleDescription('Enter an email address.');
    const moved = emails.nth(0).element();
    await userEvent.click(screen.getByRole('button', { name: 'Move up' }).nth(1));

    await expect.element(emails.nth(1)).toHaveValue('not an email');
    await expect.element(emails.nth(1)).toHaveAccessibleDescription('Enter an email address.');
    expect(emails.nth(1).element()).toBe(moved);
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }).nth(1));
    expect(emails.all().map(email => (email.element() as HTMLInputElement).value)).toEqual(['grace@example.com']);
  });
});
