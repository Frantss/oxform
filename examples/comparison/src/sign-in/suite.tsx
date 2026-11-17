import type { ComponentType } from 'react';
import { describe, expect, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { server } from '../server';
import { suiteOf } from '../suite';
import { refusedMessage } from './schema';

/** The behavior of `specification.md`, numbered as there. Every version of the sign-in form passes it. */
export const signInSuite = (name: string, Version: ComponentType, stub = false) => {
  const { it, setup } = suiteOf(Version, stub);
  const fill = async (screen: Awaited<ReturnType<typeof setup>>, email: string, password: string) => {
    await userEvent.fill(screen.getByRole('textbox', { name: 'Email' }), email);
    await userEvent.fill(screen.getByLabelText('Password'), password);
  };

  describe(`sign-in: ${name}`, () => {
    it('1, 2: shows no message before the first submit, and a message per field after an invalid one', async () => {
      await using screen = await setup();
      const signIn = vi.spyOn(server, 'signIn');
      await fill(screen, 'ada', 'short');
      await expect.element(screen.getByText('Enter an email address.')).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await expect
        .element(screen.getByRole('textbox', { name: 'Email' }))
        .toHaveAccessibleDescription('Enter an email address.');
      await expect
        .element(screen.getByLabelText('Password'))
        .toHaveAccessibleDescription('The password has at least 8 characters.');
      expect(signIn).not.toHaveBeenCalled();
    });

    it('3: validates on change after the first submit', async () => {
      await using screen = await setup();
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      await expect.element(screen.getByText('Enter an email address.')).toBeVisible();
      await userEvent.fill(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com');

      await expect.element(screen.getByText('Enter an email address.')).not.toBeInTheDocument();
    });

    it('4: calls the server with the values, and disables the button until it answers', async () => {
      await using screen = await setup();
      let answer: (accepted: boolean) => void = () => {};
      const signIn = vi.spyOn(server, 'signIn').mockImplementation(() => new Promise(resolve => (answer = resolve)));
      await fill(screen, 'ada@example.com', 'analytical');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      await expect.element(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
      answer(true);

      await expect.element(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
      expect(signIn).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'analytical' });
    });

    it('5: shows the refusal of the server on the password, and stays usable', async () => {
      await using screen = await setup();
      await fill(screen, 'ada@example.com', 'wrong password');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      await expect.element(screen.getByLabelText('Password')).toHaveAccessibleDescription(refusedMessage);
      await userEvent.fill(screen.getByLabelText('Password'), 'analytical');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await expect.element(screen.getByText(refusedMessage)).not.toBeInTheDocument();
    });
  });
};
