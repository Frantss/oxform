import { expect, it } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { App } from './app';

it('renders the placeholder text', async () => {
  const screen = await render(<App />);

  await expect.element(screen.getByRole('main')).toHaveTextContent('The examples are being rewritten for Oxform 0.7.0.');
});
