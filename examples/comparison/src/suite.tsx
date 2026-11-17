import type { ComponentType } from 'react';
import { it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

export type Screen = Awaited<ReturnType<typeof render>>;

/**
 * What a shared suite needs from the version under test. Against a stub, each case must fail: a case that passes
 * there tests nothing. A stub case stops after 2 s, which counts as a failure.
 */
export const suiteOf = (Version: ComponentType, stub = false) => ({
  it: (name: string, run: () => Promise<void>) => (stub ? it.fails : it)(name, run, stub ? 2000 : undefined),
  /** Renders the version. At the end of the case it unmounts it and restores the server. */
  setup: async () => {
    const screen = await render(<Version />);
    return Object.assign(screen, {
      [Symbol.asyncDispose]: async () => {
        await screen.unmount();
        vi.restoreAllMocks();
      },
    });
  },
});
