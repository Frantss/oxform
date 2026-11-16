import { render } from 'solid-js/web';
import { afterEach, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { App } from './app';

const container = document.createElement('div');
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  container.remove();
});

it('renders the placeholder text', async () => {
  document.body.append(container);
  dispose = render(() => <App />, container);

  await expect.element(page.getByRole('main')).toHaveTextContent('The examples are being rewritten for Oxform 0.7.0.');
});
