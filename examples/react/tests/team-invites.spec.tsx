import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { TeamInvites } from '../src/examples/team-invites';
import { setup } from './setup';

describe('TeamInvites', () => {
  it('shows the banner after a failed submit, and disables "Send invites" until the form is valid', async () => {
    await using screen = await setup(<TeamInvites />);
    const send = screen.getByRole('button', { name: 'Send invites' });
    await userEvent.click(send);

    await expect.element(screen.getByRole('alert').first()).toHaveTextContent('The form was not sent. Correct the marked fields, then try again.');
    await expect.element(send).toBeDisabled();
    await userEvent.fill(screen.getByRole('textbox', { name: 'Team' }), 'Design');
    await expect.element(send).toBeEnabled();
  });

  it('sends the invites of a valid team, and clears the form on "Clear"', async () => {
    await using screen = await setup(<TeamInvites />);
    await userEvent.fill(screen.getByRole('textbox', { name: 'Team' }), 'Design');
    await userEvent.click(screen.getByRole('button', { name: 'Invite another' }));
    await userEvent.fill(screen.getByRole('textbox', { name: 'Email' }), 'grace@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invites' }));
    await expect.element(screen.getByRole('status')).toHaveTextContent('The invites are sent.');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await expect.element(screen.getByRole('textbox', { name: 'Team' })).toHaveValue('');
    await expect.element(screen.getByRole('textbox', { name: 'Email' })).not.toBeInTheDocument();
  });
});
