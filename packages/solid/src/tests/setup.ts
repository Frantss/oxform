import { createRoot, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach } from 'vite-plus/test';

const disposers: (() => void)[] = [];

afterEach(() => {
  for (const dispose of disposers.splice(0).reverse()) dispose();
});

export const withRoot = <Value>(callback: (dispose: () => void) => Value): Value =>
  createRoot(dispose => {
    disposers.push(dispose);
    return callback(dispose);
  });

export const mount = (component: () => JSX.Element): HTMLElement => {
  const container = document.createElement('div');
  document.body.append(container);
  const dispose = render(component, container);
  disposers.push(() => {
    dispose();
    container.remove();
  });
  return container;
};
