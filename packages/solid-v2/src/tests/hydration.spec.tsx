import { HydrationForm } from '#hydration-fixture';
import html from '/src/tests/fixtures/hydration.html?raw';
import { hydrate } from '@solidjs/web';
import { flush } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';

it('should hydrate server markup without replacing controls and then update and reset', async () => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  const bootstrap = document.createElement('script');
  bootstrap.textContent = container.querySelector('script')!.textContent;
  document.head.append(bootstrap);
  bootstrap.remove();
  const original = container.querySelector('input');
  const onError = vi.fn();
  const warn = vi.spyOn(console, 'warn');
  const dispose = hydrate(() => <HydrationForm />, container, { renderId: 'oxform', onError });
  try {
    flush();
    expect(container.querySelector('input')).toBe(original);
    await expect.element(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Ada');
    await userEvent.fill(page.getByRole('textbox', { name: 'Name', exact: true }), 'Grace');
    await expect.element(page.getByRole('status')).toHaveTextContent('Grace');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect.element(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Ada');
    expect(onError).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  } finally {
    dispose();
    container.remove();
    warn.mockRestore();
  }
});
