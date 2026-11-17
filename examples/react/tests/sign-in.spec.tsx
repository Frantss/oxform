import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { SignIn } from '../src/examples/sign-in';
import { setup } from './setup';

describe('SignIn', () => {
  it('shows the errors of an empty submit, and links each one to its field', async () => {
    await using screen = await setup(<SignIn />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription('Enter an email address.');
    await expect.element(screen.getByText('The password has at least 8 characters.')).toBeVisible();
  });

  it('shows the refusal of the server, and signs in after a correction', async () => {
    await using screen = await setup(<SignIn />);
    await userEvent.fill(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com');
    await userEvent.fill(screen.getByLabelText('Password'), 'wrong password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await expect.element(screen.getByText('The email or the password is wrong.')).toBeVisible();
    await userEvent.fill(screen.getByLabelText('Password'), 'analytical');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await expect.element(screen.getByText('The email or the password is wrong.')).not.toBeInTheDocument();
  });
});
