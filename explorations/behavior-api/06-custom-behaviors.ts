// SKETCH: none of these APIs exist and this file is not compiled. The types are in api.ts and type-tests/.
//
// Use case: user-written behaviors, packaged as extensions that any compatible form can use.
// A behavior is a function `(ctx, deps) => api`. An extension is a behavior packaged with its options,
// its kind (the types that depend on `Values`), and its slots, and it states what it needs from a form.
//
// Today this needs createEffect plus code outside the form, or FieldPlugin for field extras.

import {
  configureForm,
  createEffect,
  defineExtension,
  type FormKind,
  type Path,
  type PathValue,
  type PartSpec,
  type ValidationApi,
  type ValuesApi,
} from '@oxform/core';
import { standardForm } from '@oxform/core/standard';
import z from 'zod';

// 1. Autosave. It needs `values` and `validation`, adds an option, a state slice, an api and a part.
type AutosaveOptions<Values> = { readonly saveDraft?: (draft: Values) => unknown; readonly autosaveDelay?: number };
type AutosaveApi<Values> = { readonly autosave: { flush(): unknown } };
interface AutosaveKind extends FormKind {
  readonly options: AutosaveOptions<this['values']>;
  readonly state: { readonly autosave: { readonly saving: boolean; readonly savedAt: Date | null } };
  readonly api: AutosaveApi<this['values']>;
  readonly parts: { readonly autosaveStatus: PartSpec };
}

export const withAutosave = defineExtension<{ values: ValuesApi<any>; validation: ValidationApi<any> }, AutosaveKind>({
  name: 'autosave',
  options: { saveDraft: 'action', autosaveDelay: 'number' },

  // Inert at creation: the timer starts only in response to a change, so a server render starts nothing.
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

  // The part renders while saving, as an element of the adapter's choice: { autosaveStatus: 'span' }.
  slots: slot => ({
    autosaveStatus: slot({
      present: state => state.autosave.saving,
      attrs: () => ({ role: 'status' }),
    }),
  }),
});

// 2. Field extras. Replaces FieldPlugin. The kind types the extras by the field's own value:
// `mask` exists on string fields only.
type MaskExtras<Values, P> =
  P extends Path<Values> ? (PathValue<Values, P> extends string ? { mask(pattern: string): string } : {}) : {};
interface MaskKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: {};
  readonly parts: {};
  readonly fieldExtras: MaskExtras<this['values'], this['path']>;
}

export const withMask = defineExtension<{}, MaskKind>({ name: 'mask', api: () => ({}) });

// 3. Apply extensions in any order. Each one is checked against the form it is applied to.
export const profile = configureForm(withMask(withAutosave(standardForm)), {
  schema: z.object({ phone: z.string(), tags: z.array(z.string()) }),
  defaultValues: { phone: '', tags: [] },
  saveDraft: draft => api.saveDraft(draft), // `draft` is typed as the form's values
});

const form = profile();
form.autosave.flush(); // typed from the extension's api
form.store.state.autosave.savedAt; // typed from the extension's state
form.field('phone').mask('(###) ###-####'); // typed: only string fields have `mask`
// form.field('tags').mask('#') is a type error: tags is not a string

// An extension that needs something the form lacks is a type error. `minimalForm` (03) has no validation,
// so `withAutosave(minimalForm)` does not compile.

// 4. Lifecycle hooks. The extension points are the kernel's, not private to the preset.
form.values.intercept((change, details) => {
  if (typeof change.value === 'string') return { ...change, value: change.value.trim() }; // trim
  // details.cancel() would refuse the change. details.reason and details.source say how it happened.
});

form.submit.intercept(attempt => {
  if (!confirmLeaving(attempt.values)) attempt.cancel(); // runs before validation
});
form.submit.onResult(result => analytics.track('submit', result.successful));

// createEffect keeps its signature: it subscribes a selector on any instance.
const subscription = createEffect(
  form,
  state => state.values.phone,
  phone => console.info(phone),
);
subscription.unsubscribe();
