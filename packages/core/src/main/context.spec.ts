import { describe, expect, it, vi } from 'vite-plus/test';
import { contextInternals, createContext, type ValidationLink } from './context';

describe('state slices', () => {
  it('start in the store', () => {
    const controls = createContext({});
    controls.extensionContext('counter', { count: 1 });

    expect(controls.store.state).toEqual({ count: 1 });
  });

  it('write a value and an updater to the store', () => {
    const controls = createContext({});
    const context = controls.extensionContext('counter', { count: 1, label: '' });
    context.state.count.set((current: unknown) => (current as number) + 1);
    context.state.label.set('two');

    expect(controls.store.state).toEqual({ count: 2, label: 'two' });
  });

  it('read back their value', () => {
    const context = createContext({}).extensionContext('counter', { count: 1 });

    expect(context.state.count.get()).toBe(1);
  });

  it('give each extension only its own slices', () => {
    const controls = createContext({});
    const first = controls.extensionContext('first', { a: 1 });
    const second = controls.extensionContext('second', { b: 2 });

    expect([Object.keys(first.state), Object.keys(second.state)]).toEqual([['a'], ['b']]);
  });

  it('share one store between the extensions', () => {
    const controls = createContext({});
    const first = controls.extensionContext('first', { a: 1 });
    const second = controls.extensionContext('second', { b: 2 });

    expect(new Set([first.store, second.store, controls.store]).size).toBe(1);
  });

  it('throw when two extensions declare the same key, and name both', () => {
    const controls = createContext({});
    controls.extensionContext('first', { shared: 1 });

    expect(() => controls.extensionContext('second', { shared: 2 })).toThrow(
      'The "second" extension declares the state key "shared", which "first" already declares.',
    );
  });
});

describe('options', () => {
  it('reads the current options', () => {
    const controls = createContext({ a: 1 });
    const context = controls.extensionContext('test', {});
    controls.setOptions({ a: 2 });

    expect(context.options()).toEqual({ a: 2 });
  });

  it('calls a listener with the new and the previous options', () => {
    const controls = createContext({ a: 1 });
    const listener = vi.fn();
    controls.extensionContext('test', {}).onOptions(listener);
    controls.setOptions({ a: 2 });

    expect(listener).toHaveBeenCalledWith({ a: 2 }, { a: 1 });
  });

  it('stops calling a listener after it unsubscribes', () => {
    const controls = createContext({ a: 1 });
    const listener = vi.fn();
    const unsubscribe = controls.extensionContext('test', {}).onOptions(listener);
    unsubscribe();
    controls.setOptions({ a: 2 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling the listeners after destroy', () => {
    const controls = createContext({ a: 1 });
    const listener = vi.fn();
    controls.extensionContext('test', {}).onOptions(listener);
    controls.destroy();
    controls.setOptions({ a: 2 });

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('cleanups', () => {
  it('run at an unmount, stay registered, and run again at destroy', () => {
    const controls = createContext({});
    const cleanup = vi.fn();
    controls.extensionContext('test', {}).onDestroy(cleanup);
    controls.unmount();
    controls.unmount();
    controls.destroy();

    expect(cleanup).toHaveBeenCalledTimes(3);
  });

  it('are dropped after destroy', () => {
    const controls = createContext({});
    const cleanup = vi.fn();
    controls.extensionContext('test', {}).onDestroy(cleanup);
    controls.destroy();
    controls.unmount();

    expect(cleanup).toHaveBeenCalledOnce();
  });
});

describe('instance', () => {
  it('returns the bound instance', () => {
    const controls = createContext({});
    const context = controls.extensionContext('test', {});
    const instance = { name: 'instance' };
    controls.bindInstance(instance);

    expect(context.instance()).toBe(instance);
  });

  it('throws before every extension api has run', () => {
    const context = createContext({}).extensionContext('test', {});

    expect(() => context.instance()).toThrow('The instance is available after every extension api has run.');
  });
});

describe('derived slices', () => {
  const doubledContext = () => {
    const controls = createContext({});
    const context = controls.extensionContext('doubled', { count: 1, doubled: 0 });
    contextInternals(context).derive('doubled', () => (context.state.count.get() as number) * 2);
    return { controls, context };
  };

  it('hold the computed value in the store', () => {
    expect(doubledContext().controls.store.state).toEqual({ count: 1, doubled: 2 });
  });

  it('compute again when a slice changes', () => {
    const { controls, context } = doubledContext();
    context.state.count.set(2);

    expect(controls.store.state).toEqual({ count: 2, doubled: 4 });
  });

  it('keep the reference of the state while nothing changes', () => {
    const { controls } = doubledContext();
    const first = controls.store.state;

    expect(controls.store.state).toBe(first);
  });

  it('keep the reference of the state across subscribe cycles', () => {
    const { controls } = doubledContext();
    const first = controls.store.state;
    controls.store.subscribe(() => {}).unsubscribe();
    controls.store.subscribe(() => {}).unsubscribe();

    expect(controls.store.state).toBe(first);
  });

  it('notify a subscriber when the computed value changes', () => {
    const { controls, context } = doubledContext();
    const listener = vi.fn();
    controls.store.subscribe(listener);
    context.state.count.set(3);

    expect(listener).toHaveBeenLastCalledWith({ count: 3, doubled: 6 });
  });
});

describe('contextInternals', () => {
  it('refuses an object that createContext did not make', () => {
    expect(() => contextInternals({ state: {} })).toThrow('This behavior needs a context created by createContext.');
  });
});

describe('validation link', () => {
  const link = () => contextInternals(createContext({}).extensionContext('status', {})).validation();

  it('finds every path valid without validation', () => {
    expect([link().issues(), link().issues('address.city'), link().checks]).toEqual([{}, {}, []]);
  });

  it('is not validating without validation', () => {
    expect(link().validating).toBe(false);
  });

  it('resolves a run valid with no issues without validation', async () => {
    await expect(link().run(['address.city'], { type: 'change' })).resolves.toEqual([true, {}]);
  });

  it('never reports a run without validation', () => {
    const listener = vi.fn();
    link().onRun(listener)();

    expect(listener).not.toHaveBeenCalled();
  });

  it('gives the registered validation api to every extension of the instance', () => {
    const controls = createContext({});
    const validation = controls.extensionContext('validation', {});
    const status = controls.extensionContext('status', {});
    const api: ValidationLink = { ...contextInternals(validation).validation(), validating: true };
    contextInternals(validation).registerValidation(api);

    expect(contextInternals(status).validation()).toBe(api);
  });

  it('keeps the stand-in for another instance', () => {
    const first = createContext({}).extensionContext('validation', {});
    const api: ValidationLink = { ...contextInternals(first).validation(), validating: true };
    contextInternals(first).registerValidation(api);

    expect(link().validating).toBe(false);
  });
});
