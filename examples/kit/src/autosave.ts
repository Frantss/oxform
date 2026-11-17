import { defineExtension, optionTypes, type Extendable, type MaybePromise, type Needs, type Self } from '@oxform/core';

/** `dirty`: the values changed after the last save started, valid or not. */
export type AutosaveState = { readonly saving: boolean; readonly savedAt: Date | null; readonly dirty: boolean };

/**
 * E06 and E07. A writer loses a draft when the tab closes, so `autosave` saves the values once they stop changing
 * and are valid. Its timer starts on a change, so a new instance does nothing. When the save rejects, the
 * `onSaveError` option gets the error and the instance, so the application can show it on the form.
 */
export const autosave = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'validation'>>) =>
  defineExtension(form, {
    name: 'autosave',
    needs: { api: ['values', 'validation'] },
    options: optionTypes<{
      saveDraft: (draft: Values) => MaybePromise<unknown>;
      autosaveDelay: number;
      onSaveError: (error: unknown, form: Self) => void;
    }>(),
    // A return type, because `null` alone would type `savedAt` as `null` (01-public-api.md, 7.5).
    state: (): { autosave: AutosaveState } => ({ autosave: { saving: false, savedAt: null, dirty: false } }),
    api: (context, { values, validation }) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      context.onDestroy(() => clearTimeout(timer));

      const flush = async () => {
        clearTimeout(timer);
        const [valid] = await validation.run();
        if (!valid) return;
        context.state.autosave.set(current => ({ ...current, saving: true, dirty: false }));
        try {
          await context.options().saveDraft?.(values.get());
          context.state.autosave.set(current => ({ ...current, saving: false, savedAt: new Date() }));
        } catch (error) {
          context.state.autosave.set(current => ({ ...current, saving: false, dirty: true }));
          context.options().onSaveError?.(error, context.instance<never>());
        }
      };

      values.onChange(() => {
        context.state.autosave.set(current => ({ ...current, dirty: true }));
        clearTimeout(timer);
        timer = setTimeout(() => void flush(), context.options().autosaveDelay ?? 1000);
      });

      return { autosave: { flush } };
    },
    slots: slot => ({
      autosaveStatus: slot({
        element: 'p',
        state: state => state.autosave,
        text: ({ saving, dirty, savedAt }) =>
          saving ? 'Saving the draft…' : dirty ? 'Draft not saved' : savedAt ? 'Draft saved' : undefined,
        attrs: () => ({ role: 'status' }),
      }),
    }),
  });
