import { App } from '#app';
import { render } from 'solid-js/web';
import { afterEach, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';

let cleanup: (() => void) | undefined;
afterEach(() => cleanup?.());

const setup = () => {
  const container = document.createElement('div');
  document.body.append(container);
  const dispose = render(() => <App />, container);
  cleanup = () => {
    dispose();
    container.remove();
  };
  return async (label: string, value: string) => userEvent.fill(page.getByRole('textbox', { name: label, exact: true }), value);
};

it('should validate, save with a warning, update a checkbox and reset the form', async () => {
  const fill = setup();
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect.element(page.getByLabelText('Submission result')).toHaveTextContent('Resolve the errors before saving');
  await fill('Full name', 'Ada Lovelace');
  await fill('Email', 'ada@gmail.com');
  await fill('Member 1', 'Grace Hopper');
  await expect.element(page.getByText('A company email is recommended', { exact: false })).toBeVisible();
  await expect.element(page.getByLabelText('Last email')).toHaveTextContent('ada@gmail.com');
  await page.getByRole('checkbox', { name: 'Receive updates' }).click();
  await expect.element(page.getByLabelText('Current values')).toMatchTextContent('"updates": true');
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect.element(page.getByLabelText('Submission result')).toHaveTextContent('Saved Ada Lovelace with 1 member');
  await expect.element(page.getByLabelText('Submit count')).toHaveTextContent('2');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect.element(page.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue('');
  await expect.element(page.getByRole('checkbox', { name: 'Receive updates' })).not.toBeChecked();
  await expect.element(page.getByLabelText('Submit count')).toHaveTextContent('0');
});

it('should keep member elements and writes associated after moving and removing rows', async () => {
  const fill = setup();
  await fill('Member 1', 'Grace Hopper');
  await page.getByRole('button', { name: 'Add member' }).click();
  await fill('Member 2', 'Katherine Johnson');
  const member = page.getByRole('textbox', { name: 'Member 2', exact: true }).element();
  await page.getByRole('button', { name: 'Move member 2 up' }).click();
  expect(page.getByRole('textbox', { name: 'Member 1', exact: true }).element()).toBe(member);
  await fill('Member 1', 'Katherine');
  await page.getByRole('button', { name: 'Remove member 2' }).click();
  await expect.element(page.getByLabelText('Current values')).toMatchTextContent('Katherine');
  await expect.element(page.getByLabelText('Current values')).not.toMatchTextContent('Grace Hopper');
});
