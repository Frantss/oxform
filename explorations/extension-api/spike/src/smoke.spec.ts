import { createStore } from '@tanstack/store';
import { expect, it } from 'vitest';

it('runs in Node without a window', () => {
  expect(typeof window).toBe('undefined');
  expect(createStore({ count: 1 }).state.count).toBe(1);
});
