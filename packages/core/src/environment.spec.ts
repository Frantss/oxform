import { expect, it } from 'vite-plus/test';

/** The browser globals as the unit project sees them. */
const setup = () => ({ window: typeof window, document: typeof document, [Symbol.dispose]() {} });

it('runs unit specs with no window', () => {
  using environment = setup();

  expect(environment.window).toBe('undefined');
});

it('runs unit specs with no document', () => {
  using environment = setup();

  expect(environment.document).toBe('undefined');
});
