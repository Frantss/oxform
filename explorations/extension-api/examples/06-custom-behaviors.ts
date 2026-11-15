// Type-checked: `tsc -p examples/tsconfig.json`. The types are in spike/src/api.ts and type-tests/.
//
// Use case: user-written extensions, the authoring guide. An extension is one object passed to `defineExtension`:
// `name`, `options`, `state`, `api`, `slots`, `fields`. It is a function of the form so far, so it states what it
// needs in its first argument, and `form.extend(extension)` checks that against the form.
//   - `Extendable<V, Needs<V, 'values' | 'validation'>>`: `V` is the form's values, the second type is the api it needs,
//     and an optional third is the state slices it needs. `deps` in `api` is exactly the api it needs.
//   - `options` are typed descriptors. The runtime kind and the TypeScript type are declared together.
//   - `state` is a factory. It declares every state key the extension owns, and `ctx.state.<key>` reads and writes it.
//   - `api` runs once per instance, on the server too, so it is inert: it starts no timer and no request.
// Everything else is inferred: there is no kind interface to write.
//
// 1. Autosave: options, state, api, a slot, and `Self`.
// 2. Masks: field members, typed by the field's own value.
// 3. Warnings: a second check, with a slot.
// 4. Hooks only: an extension with no api, using the kernel's hooks.
// 5. A slot only, with a state need.
// 6. Compose them, and what the compiler and the build reject.

import {
  createCheck,
  createEffect,
  defineExtension,
  defineForm,
  defineSlots,
  on,
  option,
  slots,
  type CheckState,
  type EventValidators,
  type Extendable,
  type Needs,
  type Path,
  type Self,
  type SlotFactory,
  type StatusState,
} from '@oxform/core';
import { standard } from '@oxform/core/standard';
import z from 'zod';

// 1. Autosave. It needs `values` and `validation`, and adds options, a state slice, an api and a part.
// `Self` in an option's parameters stands for the form instance. An extension cannot name the instance type, since
// later extensions add to it, and `create` replaces `Self` with the instance.
type AutosaveState = { readonly saving: boolean; readonly savedAt: Date | null; readonly dirty: boolean };

export const autosave = <V>(form: Extendable<V, Needs<V, 'values' | 'validation'>>) =>
  defineExtension(form, {
    name: 'autosave',

    options: {
      saveDraft: option.action<(draft: V, form: Self) => unknown>(),
      autosaveDelay: option.number(),
    },

    state: () => ({ autosave: { saving: false, savedAt: null, dirty: false } as AutosaveState }),

    // Inert at creation: the timer starts only in response to a change, so a server render starts nothing.
    api: (ctx, { values, validation }) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      ctx.onDestroy(() => clearTimeout(timer));

      const flush = async () => {
        ctx.state.autosave.set({ saving: true, savedAt: null, dirty: false });
        await ctx.options().saveDraft?.(values.get(), ctx.instance<Self>());
        ctx.state.autosave.set(current => ({ ...current, saving: false, savedAt: new Date() }));
      };

      values.onChange(() => {
        ctx.state.autosave.set(current => ({ ...current, dirty: true }));
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const [valid] = await validation.run();
          if (valid) await flush();
        }, ctx.options().autosaveDelay ?? 500);
      });

      return { autosave: { flush } };
    },

    // The part renders while saving, as an element of the adapter's choice: { autosaveStatus: 'span' }.
    slots: slot => ({
      autosaveStatus: slot({
        element: 'p',
        state: state => state.autosave,
        attrs: () => ({ role: 'status', className: 'hint' }),
      }),
    }),
  });

// 2. Field members. The kernel's `fields` replaces the old `fieldExtras`. `on<string>(guard)` limits the members to
// fields whose value is a string, in the types and at runtime, since types are erased and the guard decides.
// The members go on every `form.field(path)` handle and on scoped handles: `form.scope('billing').field('zip').unmasked()`.
// `field` is the base handle, so it reads the live value and keeps its members. The path given to the builder is
// relative to the scope. The extension needs `field`, since the form needs a `field(path)` api to extend.
const isString = (value: unknown): value is string => typeof value === 'string';
const digitsOf = (text: string) => text.replace(/\D/g, '');

// `#` takes the next digit. Fixed characters appear only while more digits follow.
const applyMask = (mask: string, text: string) => {
  const digits = digitsOf(text);
  let result = '';
  let used = 0;
  for (const symbol of mask) {
    if (used >= digits.length) break;
    result += symbol === '#' ? digits[used++] : symbol;
  }
  return result;
};

export const masks = <V>(form: Extendable<V, Needs<V, 'values' | 'field'>>) =>
  defineExtension(form, {
    name: 'masks',

    // One pattern per path. The keys are checked against the form's paths.
    options: { masks: option.value<{ readonly [P in Path<V>]?: string }>() },

    api: (ctx, { values }) => {
      values.intercept(change => {
        const mask = ctx.options().masks?.[change.path as Path<V>];
        if (mask === undefined || typeof change.value !== 'string') return;
        return { ...change, value: applyMask(mask, change.value) };
      });
      return {};
    },

    fields: on<string>(isString)(field => ({ unmasked: () => digitsOf(field.get()) })),
  });

// 3. A second check, packaged with its slot. It does not stop a submit. The kernel's `check('warning')` is the bare
// check. This one also adds a `fieldWarning` part. The check's name is its option, its state key and its api key,
// and `createCheck` reads the state slice that the `state` factory declared under that name.
export const warnings = <V>(form: Extendable<V, Needs<V, 'values' | 'validation'>>) =>
  defineExtension(form, {
    name: 'warnings',
    options: { warning: option.value<EventValidators<V>>() },
    state: () => ({ warning: {} as CheckState }),
    api: (ctx, deps) => ({ warning: createCheck(ctx, deps, { name: 'warning' }) }),
    slots: slot => ({
      fieldWarning: slot({
        element: 'p',
        props: { name: 'key' },
        text: ({ messages }) => messages[0],
        present: (state, part) => (state.warning[part.key] ?? []).length > 0,
        state: (state, part) => ({ messages: (state.warning[part.key] ?? []).map(entry => entry.message) }),
        attrs: () => ({ role: 'status', className: 'warning' }),
      }),
    }),
  });

// 4. Hooks only. The extension points are the kernel's, not private to the preset: `values.intercept` and
// `values.onChange`, `validation.onRun`, `submit.intercept` and `submit.onResult`. An extension that only hooks
// returns no api, so nothing is added to the form. Hooks run in the order the extensions were applied.
export const audit = <V>(form: Extendable<V, Needs<V, 'values' | 'submit'>>) =>
  defineExtension(form, {
    name: 'audit',
    api: (_ctx, { values, submit }) => {
      values.intercept((change, details) => {
        if (typeof change.value === 'string') return { ...change, value: change.value.trim() }; // trim
        // details.cancel() would refuse the change. details.reason and details.source say how it happened.
      });

      submit.intercept(attempt => {
        if (!confirmLeaving(attempt.values)) attempt.cancel(); // runs before validation
      });
      submit.onResult(result => analytics.track('submit', result.successful));

      return {};
    },
  });

// 5. A slot only, with a state need: a part that shows a failed submit. A reusable slot is a group: the `slot`
// parameter states what it needs, and the form must provide it. It is applied with `slots(...)`, which declares
// nothing, so a form without a `status` slice fails to compile at the group call, see step 6.
export const formErrorSlots = defineSlots((slot: SlotFactory<{}, { status: StatusState }>) => ({
  formError: slot({
    element: 'p',
    present: state => state.status.form.successful === false,
    attrs: () => ({ role: 'alert' }),
  }),
}));

// 6. Compose them. Each extension is checked against the ones before it, so the order is the order of the lines.
export const profile = defineForm({
  name: 'profile',
  schema: z.object({ phone: z.string(), tags: z.array(z.string()) }),
  defaultValues: { phone: '', tags: [] },
})
  .extend(standard)
  .extend(autosave)
  .extend(masks)
  .extend(warnings)
  .extend(audit)
  .extend(slots(slot => ({ ...formErrorSlots(slot) })));

const form = profile.create({
  saveDraft: draft => api.saveDraft(draft), // `draft` is typed as the form's values
  masks: { phone: '(###) ###-####' }, // keys are the form's paths
  warning: { blur: store => weakPhoneSchema(store.values) },
});

form.autosave.flush(); // typed from the extension's api
form.store.state.autosave.savedAt; // typed from the extension's state
form.field('phone').unmasked(); // typed: only string fields have `unmasked`
form.warning.at('phone');

// What the compiler and the build reject:
//   defineForm({ schema, defaultValues }).extend(autosave);   // type error: needs `values` and `validation`
//   form.field('tags').unmasked();                            // type error: tags is not a string
//   profile.create({ masks: { nope: '#' } });                 // type error: not a path
//   profile.extend(masks);                                    // throws when the form is built: option "masks" is already
//                                                             // declared by "masks"
// An api key or state key returned by two extensions throws the same way. Replacing a base member is not supported:
// give the new member another name.

// Core hooks of an instance work the same for code outside the form. `createEffect` keeps its signature: it subscribes
// a selector on any instance.
form.values.intercept((change, details) => {
  if (details.reason === 'reset') return; // reason and source say how a change happened
  return change;
});

const subscription = createEffect(
  form,
  state => state.values.phone,
  phone => console.info(phone),
);
subscription.unsubscribe();
