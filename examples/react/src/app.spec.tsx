import type { ReactNode } from 'react';
import { expect, it } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { App } from './app';

const setup = async (view: ReactNode) => {
  const screen = await render(view);

  return Object.assign(screen, { [Symbol.asyncDispose]: screen.unmount });
};

it('renders the placeholder text', async () => {
  await using screen = await setup(<App />);

  await expect.element(screen.getByRole('main')).toHaveTextContent('The examples are being rewritten for Oxform 0.7.0.');
});
