import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckApi, Extendable, Needs, ValidationApi } from './api';
import { defineExtension, defineForm, option, slotsOf } from './form';
import { createProfileForm, defaultProfile, schemaOf, type Profile } from './test-helpers';
import { values } from './values';

/** Stands in for the kernel's validation until it is ported: `failValidation` makes every run fail. */
const toyValidation = <V>(form: Extendable<V, Needs<V, 'values'>>) =>
  defineExtension(form, {
    name: 'toy-validation',
    options: { failValidation: option.value<boolean>() },
    api: ctx => ({
      validation: {
        run: async () => [!ctx.options().failValidation, {}],
      } as unknown as ValidationApi<V, 'error'>,
      error: {} as CheckApi<V, 'error'>,
    }),
  });

// Autosave, as in the readme: it needs `values` and `validation`, and adds options, state, an api and a part.
const autosave = <V>(form: Extendable<V, Needs<V, 'values' | 'validation'>>) =>
  defineExtension(form, {
    name: 'autosave',
    options: { saveDraft: option.action<(draft: V) => unknown>(), autosaveDelay: option.number() },
    state: () => ({ autosave: { saving: false, savedAt: null as Date | null } }),
    api: (ctx, { values, validation }) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      ctx.onDestroy(() => clearTimeout(timer));

      values.onChange(() => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const [valid] = await validation.run();
          if (!valid) return;
          ctx.state.autosave.set({ saving: true, savedAt: null });
          await ctx.options().saveDraft?.(values.get());
          ctx.state.autosave.set({ saving: false, savedAt: new Date() });
        }, ctx.options().autosaveDelay ?? 500);
      });

      return { autosave: { flush: () => ctx.options().saveDraft?.(values.get()) } };
    },
    slots: slot => ({
      autosaveStatus: slot({ present: state => state.autosave.saving, attrs: () => ({ role: 'status' }) }),
    }),
  });

const profile = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile }).extend(values).extend(toyValidation).extend(autosave);

const create = (options: Parameters<typeof profile.create>[0] = {}) => profile.create(options);

describe('defineExtension', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('adds an api typed from the extension, and an option typed from the form values', () => {
    const saveDraft = vi.fn();
    const form = create({ saveDraft });

    form.autosave.flush();

    expect(saveDraft).toHaveBeenCalledWith(defaultProfile);
    // @ts-expect-error the draft is typed as the form's values
    create({ saveDraft: (draft: { nope: string }) => draft });
  });

  it('adds a state slice, readable and typed on the store', () => {
    const form = create();

    expect(form.store.state.autosave).toEqual({ saving: false, savedAt: null });
  });

  it('is inert at creation: no timer starts until a change', () => {
    const timers = vi.spyOn(globalThis, 'setTimeout');

    const form = create();
    expect(timers).not.toHaveBeenCalled();

    form.values.set('name', 'a');
    expect(timers).toHaveBeenCalledOnce();
  });

  it('saves after the delay when the form is valid, and records the save', async () => {
    const saveDraft = vi.fn();
    const form = create({ saveDraft, autosaveDelay: 100 });

    form.values.set('name', 'a');
    form.values.set('name', 'ab');
    await vi.advanceTimersByTimeAsync(100);

    expect(saveDraft).toHaveBeenCalledOnce();
    expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({ name: 'ab' }));
    expect(form.store.state.autosave.savedAt).toBeInstanceOf(Date);
    expect(form.store.state.autosave.saving).toBe(false);
  });

  it('does not save an invalid form', async () => {
    const saveDraft = vi.fn();
    const form = create({ saveDraft, autosaveDelay: 10, failValidation: true });

    form.values.set('name', 'a');
    await vi.advanceTimersByTimeAsync(10);

    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('clears its timer when the form is destroyed', async () => {
    const saveDraft = vi.fn();
    const form = create({ saveDraft, autosaveDelay: 10 });

    form.values.set('name', 'a');
    form.destroy();
    await vi.advanceTimersByTimeAsync(50);

    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('adds its slot, and keeps the slots of the extensions before it', () => {
    const withBaseSlot = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile })
      .extend(values)
      .extend(toyValidation)
      .extend(form => defineExtension(form, { name: 'base', api: () => ({}), slots: slot => ({ root: slot({ element: 'form' }) }) }))
      .extend(autosave);

    expect(Object.keys(slotsOf(withBaseSlot)).sort()).toEqual(['autosaveStatus', 'root']);
    expect(withBaseSlot.create().values.get('name')).toBe('');
  });

  it('replaces a slot with the key of an earlier slot', () => {
    const replaced = profile.extend(form =>
      defineExtension(form, { name: 'replacer', api: () => ({}), slots: slot => ({ autosaveStatus: slot({ element: 'span' }) }) }),
    );

    expect((slotsOf(replaced).autosaveStatus as { element: string }).element).toBe('span');
  });

  it('applies in any order that gives its needs, each extension seeing the earlier ones', () => {
    const counter = <V>(form: Extendable<V, Needs<V, 'values'>>) =>
      defineExtension(form, {
        name: 'counter',
        api: (_ctx, { values }) => {
          let changes = 0;
          values.onChange(() => changes++);
          return { counter: { changes: () => changes } };
        },
      });

    const form = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile })
      .extend(values)
      .extend(counter)
      .extend(toyValidation)
      .extend(autosave)
      .create();
    form.values.set('name', 'a');

    expect(form.counter.changes()).toBe(1);
    expect(form.autosave).toHaveProperty('flush');
  });

  it('is rejected, by the types, on a form that lacks what it needs', () => {
    const minimal = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile }).extend(values);

    // @ts-expect-error `minimal` has no `validation`
    minimal.extend(autosave);
    // @ts-expect-error `values` has not been added yet
    defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile }).extend(toyValidation);
    expect(createProfileForm().values.get('name')).toBe('');
  });
});
