import { describe, expect, it, vi } from 'vitest';
import type { Change } from './api';
import { createChange } from './change';

type Values = { name: string };

const setup = (write: (change: Change<Values>) => boolean = () => true) => {
  const change = createChange<Values>();
  return { change, run: (value: unknown = 'a', details?: Parameters<typeof change.run>[2]) => change.run({ path: 'name', value }, write, details) };
};

describe('createChange', () => {
  it('writes, then notifies listeners, and returns true', () => {
    const order: string[] = [];
    const { change, run } = setup(() => (order.push('write'), true));
    change.onChange(() => order.push('listener'));

    expect(run()).toBe(true);
    expect(order).toEqual(['write', 'listener']);
  });

  it('lets an interceptor rewrite the change', () => {
    const write = vi.fn(() => true);
    const { change, run } = setup(write);
    change.intercept(current => ({ ...current, value: String(current.value).trim() }));

    run('  a  ');
    expect(write).toHaveBeenCalledWith({ path: 'name', value: 'a' });
  });

  it('refuses a canceled change without writing or notifying', () => {
    const write = vi.fn(() => true);
    const listener = vi.fn();
    const { change, run } = setup(write);
    change.intercept((_, details) => details.cancel());
    change.onChange(listener);

    expect(run()).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify when the write reports no change', () => {
    const listener = vi.fn();
    const { change, run } = setup(() => false);
    change.onChange(listener);

    expect(run()).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('passes details with defaults and the given reason', () => {
    const listener = vi.fn();
    const { change, run } = setup();
    change.onChange(listener);

    run('a', { reason: 'input' });
    expect(listener.mock.calls[0]?.[1]).toMatchObject({ reason: 'input', source: 'programmatic', canceled: false });
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const { change, run } = setup();
    change.onChange(listener)();

    run();
    expect(listener).not.toHaveBeenCalled();
  });
});
