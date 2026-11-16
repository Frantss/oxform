import { describe, expect, it, vi } from 'vite-plus/test';
import { createChange, type Change } from './change';

type Values = { name: string };

/** A change pipeline, and a `run` of one change at `name` with the given write. */
const setup = (write: (change: Change<Values>) => boolean = () => true) => {
  const change = createChange<Values>();

  return {
    change,
    run: (value: unknown = 'a', details?: Parameters<typeof change.run>[2]) => change.run({ path: 'name', value }, write, details),
    [Symbol.dispose]() {},
  };
};

describe('createChange', () => {
  it('writes, then notifies the listeners, and returns true', () => {
    const order: string[] = [];
    using pipeline = setup(() => (order.push('write'), true));
    pipeline.change.onChange(() => order.push('listener'));

    expect([pipeline.run(), order]).toEqual([true, ['write', 'listener']]);
  });

  it('lets an interceptor rewrite the change', () => {
    const write = vi.fn(() => true);
    using pipeline = setup(write);
    pipeline.change.intercept(current => ({ ...current, value: String(current.value).trim() }));
    pipeline.run('  a  ');

    expect(write).toHaveBeenCalledWith({ path: 'name', value: 'a' });
  });

  it('feeds the result of an earlier interceptor to a later one', () => {
    const write = vi.fn(() => true);
    using pipeline = setup(write);
    pipeline.change.intercept(current => ({ ...current, value: `${String(current.value)}b` }));
    pipeline.change.intercept(current => ({ ...current, value: `${String(current.value)}c` }));
    pipeline.run('a');

    expect(write).toHaveBeenCalledWith({ path: 'name', value: 'abc' });
  });

  it('refuses a canceled change without a write or a notification', () => {
    const write = vi.fn(() => true);
    const listener = vi.fn();
    using pipeline = setup(write);
    pipeline.change.intercept((_change, details) => details.cancel());
    pipeline.change.onChange(listener);

    expect([pipeline.run(), write.mock.calls.length, listener.mock.calls.length]).toEqual([false, 0, 0]);
  });

  it('does not notify when the write reports no change', () => {
    const listener = vi.fn();
    using pipeline = setup(() => false);
    pipeline.change.onChange(listener);

    expect([pipeline.run(), listener.mock.calls.length]).toEqual([false, 0]);
  });

  it('gives the listeners the details, with programmatic as the default reason', () => {
    const listener = vi.fn();
    using pipeline = setup();
    pipeline.change.onChange((_change, details) => listener(details.reason, details.canceled));
    pipeline.run('a');
    pipeline.run('b', { reason: 'input' });

    expect(listener.mock.calls).toEqual([
      ['programmatic', false],
      ['input', false],
    ]);
  });

  it('shows a cancel to the later interceptors', () => {
    const seen = vi.fn();
    using pipeline = setup();
    pipeline.change.intercept((_change, details) => {
      details.cancel();
      seen(details.canceled);
    });
    pipeline.run();

    expect(seen).toHaveBeenCalledWith(true);
  });

  it('stops calling an interceptor and a listener after they unsubscribe', () => {
    const interceptor = vi.fn();
    const listener = vi.fn();
    using pipeline = setup();
    pipeline.change.intercept(interceptor)();
    pipeline.change.onChange(listener)();
    pipeline.run();

    expect([interceptor.mock.calls.length, listener.mock.calls.length]).toEqual([0, 0]);
  });
});
