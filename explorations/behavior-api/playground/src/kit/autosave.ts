import type { FormKind, PartSpec, ValidationApi, ValuesApi } from '../../../api';
import { defineExtension } from '../../../spike/src/form';

type AutosaveOptions<Values> = { readonly saveDraft?: (draft: Values) => unknown; readonly autosaveDelay?: number };
type AutosaveState = { readonly saving: boolean; readonly savedAt: Date | null };

interface AutosaveKind extends FormKind {
  readonly options: AutosaveOptions<this['values']>;
  readonly state: { readonly autosave: AutosaveState };
  readonly api: { readonly autosave: { flush(): unknown } };
  readonly parts: { readonly autosaveStatus: PartSpec<{}, AutosaveState> };
}

/**
 * Saves a draft after the values stop changing, once they are valid. Adds `saveDraft` and `autosaveDelay` options,
 * an `autosave` state slice, `form.autosave.flush()`, and an `autosaveStatus` part.
 */
export const withAutosave = defineExtension<{ values: ValuesApi<any>; validation: ValidationApi<any> }, AutosaveKind>({
  name: 'autosave',
  options: { saveDraft: 'action', autosaveDelay: 'number' },
  api: (ctx, { values, validation }) => {
    const slice = ctx.slice<AutosaveState>('autosave', { saving: false, savedAt: null });
    let timer: ReturnType<typeof setTimeout> | undefined;
    ctx.onDestroy(() => clearTimeout(timer));

    const save = async () => {
      slice.set({ saving: true, savedAt: null });
      await ctx.options().saveDraft?.(values.get());
      slice.set({ saving: false, savedAt: new Date() });
    };

    values.onChange(() => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const [valid] = await validation.run();
        if (valid) await save();
      }, ctx.options().autosaveDelay ?? 500);
    });

    return { autosave: { flush: save } };
  },
  slots: slot => ({
    autosaveStatus: slot({ state: state => state.autosave, attrs: () => ({ role: 'status', className: 'hint' }) }),
  }),
});
