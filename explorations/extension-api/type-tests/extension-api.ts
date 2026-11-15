// Type tests for the extension API, against the real types in `../spike/src/api.ts`. Run: `tsc -p tsconfig.json`.
// Nothing here runs. A line marked `@ts-expect-error` must fail to compile, or the test itself fails.

import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  defineExtension,
  defineForm,
  on,
  option,
  type CheckApi,
  type Extendable,
  type Form,
  type FormContext,
  type Scope,
  type InstanceOf,
  type Needs,
  type OptionsOf,
  type Path,
  type PartsOf,
  type Self,
  type StateOf,
  type ValidationApi,
} from '../spike/src/api';

declare const schema: StandardSchemaV1<{ phone: string; tags: string[]; address: { city: string } }>;
const base = defineForm({ name: 'profile', schema, defaultValues: { phone: '', tags: [], address: { city: '' } } });

// -- Extensions under test. Their api is declared, not implemented: these are type tests.

/** Provides `values`, `validation`, `error`, and the handles: what the preset gives the extensions below. */
const kernel = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'kernel',
    api: () =>
      ({}) as Needs<Values, 'values'> & {
        validation: ValidationApi<Values, 'error'>;
        error: CheckApi<Values, 'error'>;
      } & Scope<Values, 'error'>,
  });

const autosave = <V>(form: Extendable<V, Needs<V, 'values' | 'validation'>>) =>
  defineExtension(form, {
    name: 'autosave',
    options: { saveDraft: option.action<(draft: V) => unknown>(), autosaveDelay: option.number() },
    state: () => ({ autosave: { saving: false, savedAt: null as Date | null } }),
    api: (ctx, { values, validation }) => {
      const delay: number | undefined = ctx.options().autosaveDelay;
      const id: string | undefined = ctx.options().id;
      const defaults: V = ctx.options().defaultValues;
      void [delay, id, defaults];

      const flush = async () => {
        ctx.state.autosave.set({ saving: true, savedAt: null });
        await ctx.options().saveDraft?.(values.get());
        // @ts-expect-error saving is a boolean
        ctx.state.autosave.set({ saving: 'yes', savedAt: null });
        // @ts-expect-error no such state key
        ctx.state.nope;
        ctx.state.autosave.set(current => ({ ...current, saving: false, savedAt: new Date() }));
      };
      values.onChange(async () => {
        const [valid] = await validation.run();
        if (valid) await flush();
      });
      // @ts-expect-error `autosaveDelay` is a number
      const wrong: string = ctx.options().autosaveDelay;
      void wrong;
      return { autosave: { flush } };
    },
    slots: slot => ({
      autosaveStatus: slot({
        element: 'p',
        state: state => state.autosave,
        attrs: state => ({ role: 'status', 'data-saving': state.autosave.saving }),
      }),
    }),
  });

const masks = <V>(form: Extendable<V, Needs<V, 'values' | 'field'>>) =>
  defineExtension(form, {
    name: 'masks',
    options: { masks: option.value<{ [P in Path<V>]?: string }>() },
    api: (ctx, { values }) => {
      values.intercept(change => {
        const mask = ctx.options().masks?.[change.path as Path<V>];
        if (mask !== undefined && typeof change.value === 'string') return { ...change, value: mask };
      });
      return {};
    },
    fields: on<string>((value): value is string => typeof value === 'string')(field => ({
      unmasked: () => field.get().replace(/\D/g, ''),
    })),
  });

/** Options that name the instance: `Self` becomes the instance when the form creates one. */
const submitCounter = <V>(form: Extendable<V, Needs<V, 'values'>>) =>
  defineExtension(form, {
    name: 'submit',
    options: { onSubmit: option.action<(values: V, form: Self, intent?: string) => unknown>() },
    api: (ctx, { values }) => ({
      submit: async () => {
        await ctx.options().onSubmit?.(values.get(), ctx.instance<Self>());
      },
    }),
  });

/** A field member with an upper bound on its field: another extension adds `shout` to every field. */
const shout = <V>(form: Extendable<V, Needs<V, 'field'>>) =>
  defineExtension(form, {
    name: 'shout',
    api: () => ({}),
    fields: on()(field => ({ shout: () => String(field.get()).toUpperCase() })),
  });

// -- Using extensions.

export const profile = base.extend(kernel).extend(autosave).extend(masks).extend(submitCounter);
const form = profile.create({
  saveDraft: draft => {
    const phone: string = draft.phone;
    // @ts-expect-error draft has no `nope`
    draft.nope;
    return phone;
  },
  masks: { phone: '###' },
  onSubmit: (values, instance, intent) => {
    const phone: string = values.phone;
    const saved: Date | null = instance.store.state.autosave.savedAt;
    void instance.autosave.flush();
    void [phone, saved, intent];
  },
});

void form.autosave.flush();
void form.submit();
const savedAt: Date | null = form.store.state.autosave.savedAt;
const id: string = form.id;
void form.values.get().phone;
form.destroy();
void [savedAt, id];

// Fields exist on string fields only, and scoped handles carry them with a relative path.
const unmasked: string = form.field('phone').unmasked();
const scoped: string = form.scope('address').field('city').unmasked();
// @ts-expect-error tags is not a string field
form.field('tags').unmasked();
// @ts-expect-error address.city is a string, so a path beyond it does not exist
form.scope('address').field('nope');
// @ts-expect-error scope takes a path that holds an object
form.scope('phone');
void [unmasked, scoped];

// Options are keyed by the form's paths, and base options are typed by the values.
// @ts-expect-error unknown mask path
profile.create({ masks: { nope: '#' } });
// @ts-expect-error defaultValues are typed by the schema
profile.create({ defaultValues: { phone: 1 } });
profile.create({ defaultValues: { phone: 'x', tags: [], address: { city: 'c' } }, id: 'other' });
// @ts-expect-error an option that no extension declares
profile.create({ nope: 1 });

// -- Form-level defaults: `configure` is typed like `create`, by the extensions applied so far.

const configured = profile.configure({
  saveDraft: draft => draft.phone,
  masks: { phone: '###' },
  onSubmit: (values, instance) => void [values.phone, instance.autosave.flush()],
  defaultValues: { phone: 'x', tags: [], address: { city: 'c' } },
});
// `create` still accepts every option, and overrides the configured ones.
configured.create({ saveDraft: draft => draft.address.city, masks: { phone: '#' } });
configured.create().autosave.flush();
// Calls merge: the result has the same type as the form.
configured.configure({ id: 'other' }).configure({ autosaveDelay: 10 }) satisfies typeof profile;
// @ts-expect-error `saveDraft` receives the values, so `nope` does not exist
profile.configure({ saveDraft: draft => draft.nope });
// @ts-expect-error unknown mask path
profile.configure({ masks: { nope: '#' } });
// @ts-expect-error `autosaveDelay` is a number
profile.configure({ autosaveDelay: 'soon' });
// @ts-expect-error defaultValues are typed by the schema
profile.configure({ defaultValues: { phone: 1 } });
// @ts-expect-error an option that no extension declares
profile.configure({ nope: 1 });
// @ts-expect-error `masks` belongs to an extension that is not applied yet: call `configure` again after it
base.extend(kernel).configure({ masks: { phone: '#' } });
// Applied after the extension, the same option is accepted.
base
  .extend(kernel)
  .extend(masks)
  .configure({ masks: { phone: '#' } });
// An option of an extension applied after `configure` is typed for `create` only.
const later = base.extend(kernel).configure({ id: 'x' }).extend(masks);
later.create({ masks: { phone: '#' } });
// @ts-expect-error the form has not been configured with `masks` options, but `create` types them
later.create({ masks: { nope: '#' } });

// -- Needs are checked at `.extend`.

// @ts-expect-error autosave needs `values` and `validation`
base.extend(autosave);
// @ts-expect-error autosave needs `validation`, which only the kernel extension gives
base.extend(masks).extend(autosave);
// @ts-expect-error masks needs `values` and `field`
base.extend(masks);
// An order that gives every need works, and the needs are checked per step.
base.extend(kernel).extend(masks).extend(autosave);
// @ts-expect-error a need must come before its user
base.extend(autosave).extend(kernel);

// A form with no validation stays valid, and has no validation member.
const lean = base.extend(kernel);
// @ts-expect-error `autosave` is not on a form without the extension
lean.create().autosave;

// -- Types read back from a form, for adapters.

type ProfileInstance = InstanceOf<typeof profile>;
type ProfileState = StateOf<typeof profile>;
type ProfileParts = PartsOf<typeof profile>;
type ProfileOptions = OptionsOf<typeof profile>;
const probe = {} as { instance: ProfileInstance; state: ProfileState; parts: ProfileParts; options: ProfileOptions };
const tag: 'p' = {} as ProfileParts['autosaveStatus']['element'];
const stateSaving: boolean = probe.state.autosave.saving;
const optionFn: (draft: { phone: string; tags: string[]; address: { city: string } }) => unknown =
  probe.options.saveDraft!;
void [tag, stateSaving, optionFn];

// -- Duplicate-free chain of nine extensions: it checks and stays fast.

const named =
  <const Name extends string>(name: Name) =>
  <V>(form: Extendable<V, Needs<V, 'values'>>) =>
    defineExtension(form, {
      name,
      options: { [name]: option.number() } as Record<Name, ReturnType<typeof option.number>>,
      state: () => ({ [name]: { count: 0 } }) as Record<Name, { count: number }>,
      api: (_ctx, { values }) => ({ [name]: { read: () => values.get() } }) as Record<Name, { read(): V }>,
    });

export const long = base
  .extend(kernel)
  .extend(autosave)
  .extend(masks)
  .extend(named('e1'))
  .extend(named('e2'))
  .extend(named('e3'))
  .extend(named('e4'))
  .extend(named('e5'))
  .extend(named('e6'));
const longInstance = long.create({ e6: 3, masks: { phone: '#' } });
const longPhone: string = longInstance.e6.read().phone;
const longCount: number = longInstance.store.state.e1.count;
// @ts-expect-error e1 holds a number
const longWrong: string = longInstance.store.state.e1.count;
void [longPhone, longCount, longWrong];

// -- Presets: a function from form to form, so `.extend(preset)` applies it. Nine extensions inside it.

const preset = <V, Api extends {}, Opts, State extends {}, Slots, Fields>(
  self: Form<V, Api, Opts, State, Slots, Fields>,
) =>
  self
    .extend(kernel)
    .extend(autosave)
    .extend(masks)
    .extend(named('p1'))
    .extend(named('p2'))
    .extend(named('p3'))
    .extend(named('p4'))
    .extend(named('p5'))
    .extend(shout);

const presetForm = base.extend(preset).extend(submitCounter);
const presetInstance = presetForm.create({ p5: 1, saveDraft: draft => draft.phone });
const presetSaved: Date | null = presetInstance.store.state.autosave.savedAt;
const presetShout: string = presetInstance.field('tags').shout();
const presetUnmasked: string = presetInstance.field('phone').unmasked();
void [presetSaved, presetShout, presetUnmasked];
// @ts-expect-error the preset's own needs hold, but `p6` was not added
presetInstance.p6;

// A preset applies to a form that already has extensions, and an extension applies after a preset.
const mixed = base.extend(kernel).extend(named('before')).extend(preset);
void mixed.create().before.read().phone;

// -- Extension context typing.

declare const ctx: FormContext<{ readonly a?: number }, { readonly count: number }>;
const count: number = ctx.state.count.get();
// @ts-expect-error unknown slice
ctx.state.other;
void count;

// -- Extension definition shape.

// @ts-expect-error `api` is required
defineExtension(base, { name: 'bad' });
