import type { ComponentType } from 'react';
import { describe, expect, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { server } from '../server';
import { suiteOf } from '../suite';
import { memberMessage } from './schema';

/** The behavior of `specification.md`, numbered as there. Every version of the team invites form passes it. */
export const teamInvitesSuite = (name: string, Version: ComponentType, stub = false) => {
  const { it, setup } = suiteOf(Version, stub);
  const emails = (screen: Awaited<ReturnType<typeof setup>>) => screen.getByRole('textbox', { name: 'Email' });

  describe(`team invites: ${name}`, () => {
    it('1: adds, moves and removes rows, and the values move with them', async () => {
      await using screen = await setup();
      await userEvent.click(screen.getByRole('button', { name: 'Add member' }));
      await userEvent.click(screen.getByRole('button', { name: 'Add member' }));
      await userEvent.fill(emails(screen).nth(0), 'grace@example.com');
      await userEvent.fill(emails(screen).nth(1), 'linus@example.com');
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Role' }).nth(1), 'admin');
      await userEvent.click(screen.getByRole('button', { name: 'Move up' }).nth(1));
      await expect.element(emails(screen).nth(0)).toHaveValue('linus@example.com');
      await expect.element(screen.getByRole('combobox', { name: 'Role' }).nth(0)).toHaveValue('admin');
      await userEvent.click(screen.getByRole('button', { name: 'Remove' }).nth(0));

      await expect.element(emails(screen).nth(0)).toHaveValue('grace@example.com');
      expect(screen.getByRole('listitem').all()).toHaveLength(1);
    });

    it('2: validates the format of a member email on change', async () => {
      await using screen = await setup();
      await userEvent.click(screen.getByRole('button', { name: 'Add member' }));
      await userEvent.fill(emails(screen), 'grace');
      await expect.element(emails(screen)).toHaveAccessibleDescription('Enter an email address.');
      await userEvent.fill(emails(screen), 'grace@example.com');

      await expect.element(screen.getByText('Enter an email address.')).not.toBeInTheDocument();
    });

    it('3: looks a member email up on blur', async () => {
      await using screen = await setup();
      const isMember = vi.spyOn(server, 'isMember');
      await userEvent.click(screen.getByRole('button', { name: 'Add member' }));
      await userEvent.fill(emails(screen), 'ada@example.com');
      expect(isMember).not.toHaveBeenCalled();
      await userEvent.tab();

      await expect.element(emails(screen)).toHaveAccessibleDescription(memberMessage);
    });

    it('4: validates everything on submit, the lookups too, and sends a valid team', async () => {
      await using screen = await setup();
      const sendInvites = vi.spyOn(server, 'sendInvites');
      await userEvent.click(screen.getByRole('button', { name: 'Add member' }));
      await userEvent.fill(emails(screen), 'ada@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Send invites' }));
      await expect
        .element(screen.getByRole('textbox', { name: 'Team' }))
        .toHaveAccessibleDescription('Enter a team name.');
      await expect.element(emails(screen)).toHaveAccessibleDescription(memberMessage);
      expect(sendInvites).not.toHaveBeenCalled();
      await userEvent.fill(screen.getByRole('textbox', { name: 'Team' }), 'Design');
      await userEvent.fill(emails(screen), 'grace@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Send invites' }));

      await vi.waitFor(() =>
        expect(sendInvites).toHaveBeenCalledWith({
          team: 'Design',
          seats: 1,
          members: [{ email: 'grace@example.com', role: 'member' }],
        }),
      );
    });

    it('5: resets to the default values, with no message', async () => {
      await using screen = await setup();
      await userEvent.fill(screen.getByRole('textbox', { name: 'Team' }), 'Design');
      await userEvent.click(screen.getByRole('button', { name: 'Add member' }));
      await userEvent.click(screen.getByRole('button', { name: 'Send invites' }));
      await expect.element(screen.getByText('Enter an email address.')).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

      await expect.element(screen.getByRole('textbox', { name: 'Team' })).toHaveValue('');
      expect([screen.getByRole('listitem').all().length, screen.getByText('Enter an email address.').query()]).toEqual([
        0,
        null,
      ]);
    });
  });
};
