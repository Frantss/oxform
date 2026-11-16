import { describe, expect, it, vi } from 'vite-plus/test';
import { createContext } from './context';

const setup = <Options extends object>(options: Options = {} as Options) => {
  const controls = createContext(options);

  return Object.assign(controls, { [Symbol.dispose]: () => controls.destroy() });
};

describe('state slices', () => {
  it('start in the store', () => {
    using controls = setup();
    controls.extensionContext('counter', { count: 1 });

    expect(controls.store.state).toEqual({ count: 1 });
  });

  it('write a value and an updater to the store', () => {
    using controls = setup();
    const context = controls.extensionContext('counter', { count: 1, label: '' });
    context.state.count.set((current: unknown) => (current as number) + 1);
    context.state.label.set('two');

    expect(controls.store.state).toEqual({ count: 2, label: 'two' });
  });

  it('read back their value', () => {
    using controls = setup();
    const context = controls.extensionContext('counter', { count: 1 });

    expect(context.state.count.get()).toBe(1);
  });

  it('give each extension only its own slices', () => {
    using controls = setup();
    const first = controls.extensionContext('first', { a: 1 });
    const second = controls.extensionContext('second', { b: 2 });

    expect([Object.keys(first.state), Object.keys(second.state)]).toEqual([['a'], ['b']]);
  });

  it('share one store between the extensions', () => {
    using controls = setup();
    const first = controls.extensionContext('first', { a: 1 });
    const second = controls.extensionContext('second', { b: 2 });

    expect(new Set([first.store, second.store, controls.store]).size).toBe(1);
  });

  it('throw when two extensions declare the same key, and name both', () => {
    using controls = setup();
    controls.extensionContext('first', { shared: 1 });

    expect(() => controls.extensionContext('second', { shared: 2 })).toThrow(
      'The "second" extension declares the state key "shared", which "first" already declares.',
    );
  });
});

describe('options', () => {
  it('reads the current options', () => {
    using controls = setup({ a: 1 });
    const context = controls.extensionContext('test', {});
    controls.setOptions({ a: 2 });

    expect(context.options()).toEqual({ a: 2 });
  });

  it('calls a listener with the new and the previous options', () => {
    using controls = setup({ a: 1 });
    const listener = vi.fn();
    controls.extensionContext('test', {}).onOptions(listener);
    controls.setOptions({ a: 2 });

    expect(listener).toHaveBeenCalledWith({ a: 2 }, { a: 1 });
  });

  it('stops calling a listener after it unsubscribes', () => {
    using controls = setup({ a: 1 });
    const listener = vi.fn();
    const unsubscribe = controls.extensionContext('test', {}).onOptions(listener);
    unsubscribe();
    controls.setOptions({ a: 2 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling the listeners after destroy', () => {
    using controls = setup({ a: 1 });
    const listener = vi.fn();
    controls.extensionContext('test', {}).onOptions(listener);
    controls.destroy();
    controls.setOptions({ a: 2 });

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('cleanups', () => {
  it('run at an unmount, stay registered, and run again at destroy', () => {
    using controls = setup();
    const cleanup = vi.fn();
    controls.extensionContext('test', {}).onDestroy(cleanup);
    controls.unmount();
    controls.unmount();
    controls.destroy();

    expect(cleanup).toHaveBeenCalledTimes(3);
  });

  it('are dropped after destroy', () => {
    using controls = setup();
    const cleanup = vi.fn();
    controls.extensionContext('test', {}).onDestroy(cleanup);
    controls.destroy();
    controls.unmount();

    expect(cleanup).toHaveBeenCalledOnce();
  });
});

describe('instance', () => {
  it('returns the bound instance', () => {
    using controls = setup();
    const context = controls.extensionContext('test', {});
    const instance = { name: 'instance' };
    controls.bindInstance(instance);

    expect(context.instance()).toBe(instance);
  });

  it('throws before every extension api has run', () => {
    using controls = setup();
    const context = controls.extensionContext('test', {});

    expect(() => context.instance()).toThrow('The instance is available after every extension api has run.');
  });
});
