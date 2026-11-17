import type { ReactNode } from 'react';
import { render } from 'vitest-browser-react';

/** Renders a view, and unmounts it at the end of the case. */
export const setup = async (view: ReactNode) => {
  const screen = await render(view);
  return Object.assign(screen, { [Symbol.asyncDispose]: () => screen.unmount() });
};
