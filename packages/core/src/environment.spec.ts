import { expect, it } from 'vite-plus/test';

it('runs unit specs with no window', () => {
  expect(typeof window).toBe('undefined');
});

it('runs unit specs with no document', () => {
  expect(typeof document).toBe('undefined');
});
