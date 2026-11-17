import type { JSX } from '@solidjs/web';
import { render } from '@solidjs/web';
import { page } from 'vite-plus/test/browser';

let views = 0;

/**
 * Renders a view in a container, and disposes it at the end of the case. The locator finds the container by a test
 * id, because a locator of the element itself finds it by its text, which the case changes.
 */
export const setup = (view: () => JSX.Element) => {
  const container = document.body.appendChild(document.createElement('div'));
  container.dataset.testid = `view-${++views}`;
  const dispose = render(view, container);

  return Object.assign(page.getByTestId(container.dataset.testid), {
    container,
    [Symbol.dispose]: () => {
      dispose();
      container.remove();
    },
  });
};
