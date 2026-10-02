import { StrictMode } from 'react';
import { expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';
import { Example_Checks } from '../examples/checks';

const setup = async (verifyEmail = async (email: string) => !email.endsWith('@blocked.example')) => {
  const screen = await render(
    <StrictMode>
      <Example_Checks verifyEmail={verifyEmail} />
    </StrictMode>,
  );
  const fill = async (name: string, value: string) => {
    const input = screen.getByRole('textbox', { name, exact: true });
    await userEvent.clear(input);
    await userEvent.type(input, value);
  };
  const fillAccount = async (email = 'ada@company.com') => {
    await fill('Full name', 'Ada Lovelace');
    await fill('Email', email);
    await fill('Member 1', 'Grace Hopper');
  };

  return { screen, fill, fillAccount };
};

it('should render errors for nested and array fields and reject an empty submit', async () => {
  const { screen } = await setup();
  await screen.getByRole('button', { name: 'Save account' }).click();

  await expect.element(screen.getByLabelText('Submission result')).toHaveTextContent('Resolve the errors or blocking issues before saving');
  await expect.element(screen.getByText('Enter at least three characters for your name', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('Enter a valid email address', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('Enter at least three characters for the member name', { exact: false })).toBeVisible();
  await expect.element(screen.getByLabelText('Form validity')).toHaveTextContent('Invalid');
  await expect.element(screen.getByLabelText('Submit count')).toHaveTextContent('1');
});

it('should allow submission with a non-blocking builder warning', async () => {
  const { screen, fillAccount } = await setup();
  await fillAccount('ada@gmail.com');

  await expect.element(screen.getByText('A company email is recommended for Ada Lovelace', { exact: false })).toBeVisible();
  await expect.element(screen.getByLabelText('Form validity')).toHaveTextContent('Valid');
  await screen.getByRole('button', { name: 'Save account' }).click();
  await expect.element(screen.getByLabelText('Submission result')).toHaveTextContent('Saved Ada Lovelace with 1 member');
  await expect.element(screen.getByText('A company email is recommended for Ada Lovelace', { exact: false })).toBeVisible();
});

it('should wait for async blocking checks and allow a corrected resubmission', async () => {
  let resolve!: (valid: boolean) => void;
  const pending = new Promise<boolean>(resolver => {
    resolve = resolver;
  });
  const { screen, fill, fillAccount } = await setup(email => (email.endsWith('@blocked.example') ? pending : Promise.resolve(true)));
  await fillAccount('ada@blocked.example');
  await screen.getByRole('button', { name: 'Save account' }).click();

  await expect.element(screen.getByRole('button', { name: 'Checking email…' })).toBeDisabled();
  await expect.element(screen.getByLabelText('Submit count')).toHaveTextContent('0');
  resolve(false);
  await expect.element(screen.getByText('This email domain is blocked', { exact: false })).toBeVisible();
  await expect.element(screen.getByLabelText('Form validity')).toHaveTextContent('Invalid');

  await fill('Email', 'ada@company.com');
  await screen.getByRole('button', { name: 'Save account' }).click();
  await expect.element(screen.getByLabelText('Submission result')).toHaveTextContent('Saved Ada Lovelace with 1 member');
  await expect.element(screen.getByLabelText('Form validity')).toHaveTextContent('Valid');
  await expect.element(screen.getByLabelText('Submit count')).toHaveTextContent('2');
});

it('should preserve a manual blocking issue until review is cleared', async () => {
  const { screen, fillAccount } = await setup();
  await fillAccount();
  await screen.getByRole('button', { name: 'Flag email for review' }).click();
  await screen.getByRole('button', { name: 'Save account' }).click();

  await expect.element(screen.getByText('Email needs manual review', { exact: false })).toBeVisible();
  await expect.element(screen.getByLabelText('Submission result')).toHaveTextContent('Resolve the errors or blocking issues before saving');
  await screen.getByRole('button', { name: 'Clear review' }).click();
  await screen.getByRole('button', { name: 'Save account' }).click();
  await expect.element(screen.getByLabelText('Submission result')).toHaveTextContent('Saved Ada Lovelace with 1 member');
});

it('should preserve member identity and values when reordering and removing items', async () => {
  const { screen, fill, fillAccount } = await setup();
  await fillAccount();
  await screen.getByRole('button', { name: 'Add member' }).click();
  await fill('Member 2', 'Katherine Johnson');
  const memberId = screen.getByRole('textbox', { name: 'Member 2', exact: true }).element().id;
  await screen.getByRole('button', { name: 'Move member 2 up' }).click();

  await expect.element(screen.getByRole('textbox', { name: 'Member 1', exact: true })).toHaveValue('Katherine Johnson');
  expect(screen.getByRole('textbox', { name: 'Member 1', exact: true }).element().id).toBe(memberId);
  await screen.getByRole('button', { name: 'Remove member 2' }).click();
  await screen.getByRole('button', { name: 'Save account' }).click();
  await expect.element(screen.getByLabelText('Current values')).toMatchTextContent('Katherine Johnson');
  await expect.element(screen.getByLabelText('Current values')).not.toMatchTextContent('Grace Hopper');
  await expect.element(screen.getByLabelText('Submission result')).toHaveTextContent('Saved Ada Lovelace with 1 member');
});

it('should restore defaults and clear issues, submission state, and added members on reset', async () => {
  const { screen, fillAccount } = await setup();
  await fillAccount('ada@gmail.com');
  await screen.getByRole('button', { name: 'Add member' }).click();
  await screen.getByRole('button', { name: 'Flag email for review' }).click();
  await screen.getByRole('button', { name: 'Save account' }).click();
  await expect.element(screen.getByLabelText('Submit count')).toHaveTextContent('1');
  await screen.getByRole('button', { name: 'Reset', exact: true }).click();

  await expect.element(screen.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue('');
  await expect.element(screen.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('');
  await expect.element(screen.getByRole('textbox', { name: 'Member 1', exact: true })).toHaveValue('');
  await expect.element(screen.getByRole('textbox', { name: 'Member 2', exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText('Email needs manual review', { exact: false })).not.toBeInTheDocument();
  await expect.element(screen.getByLabelText('Submission result')).toBeEmptyDOMElement();
  await expect.element(screen.getByLabelText('Submit count')).toHaveTextContent('0');
  await expect.element(screen.getByLabelText('Form validity')).toHaveTextContent('Valid');
});
