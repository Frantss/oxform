import type { Extendable, Needs } from '../spike/src/api';
import { defineExtension, option } from '../spike/src/form';

/** `dirty`: the values changed since the last save started, whether or not they are valid. */
type AutosaveState = { readonly saving: boolean; readonly savedAt: Date | null; readonly dirty: boolean };

/**
 * Saves a draft after the values stop changing, once they are valid. Adds `saveDraft` and `autosaveDelay` options,
 * an `autosave` state key, `form.autosave.flush()`, and an `autosaveStatus` slot.
 */
export const autosave = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'validation'>>) =>
  defineExtension(form, {
    name: 'autosave',
    options: { saveDraft: option.action<(draft: Values) => unknown>(), autosaveDelay: option.number() },
    state: () => ({ autosave: { saving: false, savedAt: null, dirty: false } as AutosaveState }),
    api: (ctx, { values, validation }) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      ctx.onDestroy(() => clearTimeout(timer));

      const save = async () => {
        ctx.state.autosave.set({ saving: true, savedAt: null, dirty: false });
        await ctx.options().saveDraft?.(values.get());
        ctx.state.autosave.set(current => ({ ...current, saving: false, savedAt: new Date() }));
      };

      values.onChange(() => {
        ctx.state.autosave.set(current => ({ ...current, dirty: true }));
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const [valid] = await validation.run();
          if (valid) await save();
        }, ctx.options().autosaveDelay ?? 500);
      });

      return { autosave: { flush: save } };
    },
    slots: slot => ({
      autosaveStatus: slot({
        element: 'p',
        state: state => state.autosave,
        attrs: () => ({ role: 'status', className: 'hint' }),
      }),
    }),
  });
