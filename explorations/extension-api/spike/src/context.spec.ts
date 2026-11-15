import { describe, expect, it, vi } from 'vitest';
import { contextInternals, createContext } from './context';

describe('createContext', () => {
  it('starts the state slices of an extension in the store and reads them back', () => {
    const controls = createContext({});
    const ctx = controls.extensionContext('counter', { count: 1 });
    ctx.state.count.set((current: number) => current + 1);

    expect(ctx.state.count.get()).toBe(2);
    expect(controls.store.state).toEqual({ count: 2 });
  });

  it('gives each extension only its own slices, over one shared store', () => {
    const controls = createContext({});
    const first = controls.extensionContext('first', { a: 1 });
    const second = controls.extensionContext('second', { b: 2 });

    expect(Object.keys(first.state)).toEqual(['a']);
    expect(Object.keys(second.state)).toEqual(['b']);
    expect(controls.store.state).toEqual({ a: 1, b: 2 });
  });

  it('throws when two extensions declare the same state key, and names both', () => {
    const controls = createContext({});
    controls.extensionContext('first', { shared: 1 });

    expect(() => controls.extensionContext('second', { shared: 2 })).toThrow(
      'The "second" extension declares the state key "shared", which "first" already declares.',
    );
  });

  it('notifies option listeners and runs cleanups on destroy', () => {
    const controls = createContext({ a: 1 });
    const ctx = controls.extensionContext('test', {});
    const onOptions = vi.fn();
    const cleanup = vi.fn();
    ctx.onOptions(onOptions);
    ctx.onDestroy(cleanup);

    controls.setOptions({ a: 2 });
    expect(ctx.options()).toEqual({ a: 2 });
    expect(onOptions).toHaveBeenCalledWith({ a: 2 }, { a: 1 });

    controls.destroy();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('keeps a derived slice in the store, with a stable reference while nothing changed', () => {
    const controls = createContext({});
    const ctx = controls.extensionContext('doubled', { count: 1, doubled: 0 });
    contextInternals(ctx).derive('doubled', () => (ctx.state.count.get() as number) * 2);

    const first = controls.store.state;
    expect(first).toEqual({ count: 1, doubled: 2 });
    expect(controls.store.state).toBe(first);

    ctx.state.count.set(2);
    expect(controls.store.state).toEqual({ count: 2, doubled: 4 });
  });

  it('rejects a context that did not come from createContext', () => {
    expect(() => contextInternals({})).toThrow('needs a context created by createContext');
  });
});

describe('field members', () => {
  const handle = () => ({
    get: () => 'text' as unknown,
    get state() {
      return { live: true };
    },
  });

  it('adds members to a handle, keeps its live getters, and gives the relative path', () => {
    const controls = createContext({});
    controls.addFields('upper', { build: (field, path) => ({ upper: () => `${path}:${String(field.get()).toUpperCase()}` }) });
    const ctx = controls.extensionContext('handles', {});

    const decorated = contextInternals(ctx).decorateField(handle(), 'name') as ReturnType<typeof handle> & {
      upper(): string;
    };

    expect(decorated.upper()).toBe('name:TEXT');
    expect(decorated.state).toEqual({ live: true });
  });

  it('skips members whose guard rejects the value', () => {
    const controls = createContext({});
    controls.addFields('numeric', {
      guard: value => typeof value === 'number',
      build: () => ({ double: () => 2 }),
    });
    const ctx = controls.extensionContext('handles', {});

    expect(contextInternals(ctx).decorateField(handle(), 'name')).not.toHaveProperty('double');
  });

  it('throws when a member redefines a handle member', () => {
    const controls = createContext({});
    controls.addFields('bad', { build: () => ({ get: () => 'x' }) });
    const ctx = controls.extensionContext('handles', {});

    expect(() => contextInternals(ctx).decorateField(handle(), 'name')).toThrow('The "bad" extension cannot redefine the field member "get".');
  });

  it('throws when two extensions add the same member, and names both', () => {
    const controls = createContext({});
    controls.addFields('first', { build: () => ({ shared: () => 1 }) });
    controls.addFields('second', { build: () => ({ shared: () => 2 }) });
    const ctx = controls.extensionContext('handles', {});

    expect(() => contextInternals(ctx).decorateField(handle(), 'name')).toThrow(
      'The "second" extension cannot redefine the field member "shared", which "first" adds.',
    );
  });
});
