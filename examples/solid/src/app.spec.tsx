import { render } from 'solid-js/web';
import type { JSX } from 'solid-js';
import { expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { App } from './app';

const setup = (view: () => JSX.Element) => {
  const container = document.body.appendChild(document.createElement('div'));
  const dispose = render(view, container);

  return Object.assign(page.elementLocator(container), {
    [Symbol.dispose]: () => {
      dispose();
      container.remove();
    },
  });
};

it('renders the placeholder text', async () => {
  using screen = setup(() => <App />);

  await expect.element(screen.getByRole('main')).toHaveTextContent('The examples are being rewritten for Oxform 0.7.0.');
});
