import { describe, expect, it, vi } from 'vite-plus/test';
import { schemaOf } from '../../tests/helpers';
import { createEffect } from './effect';
import { defineExtension, defineForm } from './form';
import type { Extendable } from './types';

type Filters = { query: string; tags: string[] };

/** A `filters` state key, and an api that writes it. */
const filters = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'filters',
    state: options => ({ filters: options.defaultValues }),
    api: context => ({ set: (next: Values) => context.state.filters.set(next) }),
  });

/** An instance with the `filters` state, and an effect on its `tags`. */
const setup = (effect: (tags: string[]) => unknown = vi.fn()) => {
  const instance = defineForm({ schema: schemaOf<Filters>(), defaultValues: { query: '', tags: [] } })
    .extend(filters)
    .create();
  const subscription = createEffect(instance, state => state.filters.tags, effect as (tags: string[]) => void);

  return Object.assign(instance, {
    effect,
    subscription,
    [Symbol.dispose]: () => {
      subscription.unsubscribe();
      instance.destroy();
    },
  });
};

describe('createEffect', () => {
  it('is not called for the first selection', () => {
    using subject = setup();

    expect(subject.effect).not.toHaveBeenCalled();
  });

  it('is called with each selection that changes', () => {
    using subject = setup();
    subject.set({ query: '', tags: ['a'] });
    subject.set({ query: '', tags: ['a', 'b'] });

    expect(vi.mocked(subject.effect).mock.calls).toEqual([[['a']], [['a', 'b']]]);
  });

  it('is not called for a deeply equal selection', () => {
    using subject = setup();
    subject.set({ query: 'x', tags: [] });

    expect(subject.effect).not.toHaveBeenCalled();
  });

  it('stops after unsubscribe', () => {
    using subject = setup();
    subject.subscription.unsubscribe();
    subject.set({ query: '', tags: ['a'] });

    expect(subject.effect).not.toHaveBeenCalled();
  });

  it('does not wait for an async effect, so two runs may overlap', () => {
    const pending: (() => void)[] = [];
    using subject = setup(() => new Promise<void>(resolve => pending.push(resolve)));
    subject.set({ query: '', tags: ['a'] });
    subject.set({ query: '', tags: ['b'] });
    const overlapping = pending.length;
    pending.forEach(resolve => resolve());

    expect(overlapping).toBe(2);
  });
});
