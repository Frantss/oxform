import { describe, expect, it, vi } from 'vitest';
import { createEffect } from './effect';
import { createProfileForm } from './test-helpers';

describe('createEffect', () => {
  it('is not called for the initial selection, and is called with each changed selection', () => {
    const form = createProfileForm();
    const effect = vi.fn();
    createEffect(form, state => state.values.name, effect);
    expect(effect).not.toHaveBeenCalled();

    form.values.set('name', 'a');
    form.values.set('name', 'b');

    expect(effect.mock.calls.map(([value]) => value)).toEqual(['a', 'b']);
  });

  it('ignores changes that leave the selection deeply equal', () => {
    const form = createProfileForm();
    const effect = vi.fn();
    createEffect(form, state => ({ city: state.values.address.city }), effect);

    form.values.set('name', 'a');
    form.values.set('address.city', 'Paris');
    form.values.set('address.city', 'Paris');

    expect(effect).toHaveBeenCalledOnce();
    expect(effect).toHaveBeenCalledWith({ city: 'Paris' });
  });

  it('stops after unsubscribe', () => {
    const form = createProfileForm();
    const effect = vi.fn();
    const subscription = createEffect(form, state => state.values.name, effect);

    subscription.unsubscribe();
    form.values.set('name', 'a');

    expect(effect).not.toHaveBeenCalled();
  });

  it('lets async callbacks overlap', async () => {
    const form = createProfileForm();
    const finished: string[] = [];
    createEffect(
      form,
      state => state.values.name,
      async value => {
        await new Promise(resolve => setTimeout(resolve, value === 'slow' ? 5 : 0));
        finished.push(value);
      },
    );

    form.values.set('name', 'slow');
    form.values.set('name', 'fast');
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(finished).toEqual(['fast', 'slow']);
  });
});
