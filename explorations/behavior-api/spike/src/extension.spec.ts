import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormKind, PartSpec, ValidationApi, ValuesApi } from '../../api';
import { createChange } from './change';
import { configureForm, defineExtension, defineForm, slotsOf } from './form';
import { standardForm } from './standard';
import { createProfileForm, defaultProfile, failing, schemaOf, type Profile } from './test-helpers';
import { createValues } from './values';

// Autosave, as in sketch 06: it needs `values` and `validation`, and adds an option, state, an api and a part.
type AutosaveOptions<Values> = { readonly saveDraft?: (draft: Values) => unknown; readonly autosaveDelay?: number };
type AutosaveApi = { readonly autosave: { flush(): unknown } };
interface AutosaveKind extends FormKind {
  readonly options: AutosaveOptions<this['values']>;
  readonly state: { readonly autosave: { readonly saving: boolean; readonly savedAt: Date | null } };
  readonly api: AutosaveApi;
  readonly parts: { readonly autosaveStatus: PartSpec };
}

const withAutosave = defineExtension<{ values: ValuesApi<any>; validation: ValidationApi<any> }, AutosaveKind>({
  name: 'autosave',
  options: { saveDraft: 'action', autosaveDelay: 'number' },
  api: (ctx, { values, validation }) => {
    const slice = ctx.slice('autosave', { saving: false, savedAt: null as Date | null });
    let timer: ReturnType<typeof setTimeout> | undefined;
    ctx.onDestroy(() => clearTimeout(timer));

    values.onChange(() => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const [valid] = await validation.run();
        if (!valid) return;
        slice.set({ saving: true, savedAt: null });
        await ctx.options().saveDraft?.(values.get());
        slice.set({ saving: false, savedAt: new Date() });
      }, ctx.options().autosaveDelay ?? 500);
    });

    return { autosave: { flush: () => ctx.options().saveDraft?.(values.get()) } };
  },
  slots: slot => ({
    autosaveStatus: slot({ present: state => state.autosave.saving, attrs: () => ({ role: 'status' }) }),
  }),
});

const create = (options: Partial<{ saveDraft: (draft: Profile) => unknown; autosaveDelay: number }> = {}) =>
  configureForm(withAutosave(standardForm), {
    schema: schemaOf<Profile>(),
    defaultValues: defaultProfile,
    ...options,
  })();

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
    const form = configureForm(withAutosave(standardForm), {
      schema: schemaOf<Profile>(),
      defaultValues: defaultProfile,
      error: { change: failing({ message: 'Bad', path: ['name'] }) },
      saveDraft,
      autosaveDelay: 10,
    })();

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

  it('adds its slot, and keeps the base api and slots', () => {
    const form = create();

    expect(Object.keys(slotsOf(withAutosave(standardForm))).sort()).toEqual(['autosaveStatus', 'field', 'fieldError', 'reset', 'root', 'submit']);
    expect(form.values.get('name')).toBe('');
    expect(form.validation).toBeDefined();
  });

  it('applies in any order, each extension seeing the earlier ones', () => {
    interface CounterKind extends FormKind {
      readonly options: {};
      readonly state: {};
      readonly api: { readonly counter: { changes(): number } };
      readonly parts: {};
    }
    const withCounter = defineExtension<{ values: ValuesApi<any> }, CounterKind>({
      name: 'counter',
      api: (_ctx, { values }) => {
        let changes = 0;
        values.onChange(() => changes++);
        return { counter: { changes: () => changes } };
      },
    });

    const form = configureForm(withCounter(withAutosave(standardForm)), {
      schema: schemaOf<Profile>(),
      defaultValues: defaultProfile,
    })();
    form.values.set('name', 'a');

    expect(form.counter.changes()).toBe(1);
    expect(form.autosave).toHaveProperty('flush');
  });

  it('is rejected, by the types, on a form that lacks what it needs', () => {
    type MinimalKind = FormKind & {
      readonly options: { readonly schema: unknown; readonly defaultValues: unknown };
      readonly state: {};
      readonly api: { readonly values: ValuesApi<Profile> };
      readonly parts: {};
    };
    const minimal = defineForm<MinimalKind>({
      name: 'minimal',
      options: { schema: 'value', defaultValues: 'value' },
      api: ctx => ({ values: createValues(ctx as never, { change: createChange(ctx) }) }),
    });

    // @ts-expect-error `minimal` has no `validation`
    withAutosave(minimal);
    expect(createProfileForm().values.get('name')).toBe('');
  });
});
