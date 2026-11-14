import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  type EventsApi,
  type FormKind,
  type HandlesApi,
  type Path,
  type PartSpec,
  type PathValue,
  type SlotFactory,
  type StandardKind,
  type StatusApi,
  type ValidationApi,
  type ValuesApi,
  configureForm,
  createChange,
  createFieldEvents,
  createFieldStatus,
  createParts,
  createValues,
  defineExtension,
  defineForm,
  defineFragment,
  defineSlots,
  standardForm,
} from '../api';

type Account = { name: string; tags: string[]; email: string };
declare const accountSchema: StandardSchemaV1<Account>;
const accountDefaults: Account = { name: '', tags: [], email: '' };

// 1. Field extras: typed by the field's own value
type MaskExtras<Values, P> =
  P extends Path<Values> ? (PathValue<Values, P> extends string ? { mask(pattern: string): string } : {}) : {};
interface MaskKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: {};
  readonly parts: {};
  readonly fieldExtras: MaskExtras<this['values'], this['path']>;
}
const masked = defineExtension<{ field: (path: any) => { get(): unknown } }, MaskKind>({
  name: 'masked',
  api: () => ({}),
  fieldExtras: (_path, field) => ({ mask: pattern => `${pattern}${String(field.get())}` }),
});
const maskedForm = configureForm(masked(standardForm), { schema: accountSchema, defaultValues: accountDefaults })();
maskedForm.field('name').mask('#');
maskedForm.field('name').change('x'); // base handle is kept
// @ts-expect-error extras only on string values
maskedForm.field('tags').mask('#');
// @ts-expect-error unknown path
maskedForm.field('nope');

// 2. Fragments mount under a prefix and add to Values
type Address = { street: string; zip: string };
declare const addressSchema: StandardSchemaV1<Address>;
const address = defineFragment({
  schema: addressSchema,
  defaultValues: { street: '', zip: '' },
  checks: { error: { change: addressSchema } },
});
const checkout = configureForm(standardForm, {
  schema: accountSchema,
  defaultValues: accountDefaults,
  fragments: { billing: address, shipping: address },
  onSubmit: values => values.billing.zip.toUpperCase(),
})();
checkout.field('name').change('x');
checkout.field('billing.zip').change('12345');
checkout.field('shipping.street').get().toUpperCase();
// @ts-expect-error mounted paths are typed
checkout.field('billing.nope');
checkout.scope('billing').field('zip').change('1');
// @ts-expect-error scoped paths are typed
checkout.scope('billing').field('nope');

// Scoped handles carry the extras of an extension, typed by the sub-object's own values at every depth of `scope`
const maskedCheckout = configureForm(masked(standardForm), {
  schema: accountSchema,
  defaultValues: accountDefaults,
  fragments: { billing: address },
})();
maskedCheckout.scope('billing').field('zip').mask('#####');
maskedCheckout.scope('billing').field('zip').change('1'); // the base handle is kept
maskedCheckout.scope('billing').field('zip').error(); // and the check sugar
// @ts-expect-error scoped paths are typed
maskedCheckout.scope('billing').field('nope');
type Deep = { a: { b: { c: { text: string; count: number } } } };
declare const deepSchema: StandardSchemaV1<Deep>;
const deep = configureForm(masked(standardForm), {
  schema: deepSchema,
  defaultValues: { a: { b: { c: { text: '', count: 0 } } } },
})();
deep.scope('a').scope('b').scope('c').field('text').mask('#'); // three levels deep
deep.scope('a').scope('b').scope('c').field('text').change('x'); // the base handle is kept
// @ts-expect-error `count` is not a string
deep.scope('a').scope('b').scope('c').field('count').mask('#');
addressFields(maskedCheckout.scope('billing')); // still assignable to a function written for `HandlesApi`

// A component written once for the fragment works at any mount point
function addressFields(scope: HandlesApi<Address, 'error'>) {
  scope.field('zip').change('x');
}
addressFields(checkout.scope('billing'));
addressFields(checkout.scope('shipping'));
// @ts-expect-error a scope of the wrong shape is rejected
addressFields(checkout.scope('name'));

// A form without fragments is unchanged
configureForm(standardForm, { schema: accountSchema, defaultValues: accountDefaults })().field('name');

// 3. A packaged extension states what it needs from a base
type AutosaveOptions<Values> = { readonly saveDraft?: (draft: Values) => unknown };
type AutosaveApi<Values> = { readonly autosave: { flush(): Values } };
interface AutosaveKind extends FormKind {
  readonly options: AutosaveOptions<this['values']>;
  readonly state: { readonly autosave: { readonly saving: boolean } };
  readonly api: AutosaveApi<this['values']>;
  readonly parts: { readonly autosaveStatus: PartSpec };
}
type AutosaveNeeds = { readonly values: ValuesApi<any>; readonly validation: ValidationApi<any> };
const autosave = defineExtension<AutosaveNeeds, AutosaveKind>({
  name: 'autosave',
  options: { saveDraft: 'action' },
  api: (_ctx, { values }) => ({ autosave: { flush: () => values.get() } }),
  slots: slot => ({ autosaveStatus: slot({ present: state => state.autosave.saving }) }),
});
const draft = configureForm(autosave(standardForm), {
  schema: accountSchema,
  defaultValues: accountDefaults,
  saveDraft: value => value.email.toUpperCase(),
});
draft().autosave.flush().email;
const draftParts = createParts(draft, { root: 'form', autosaveStatus: 'span' });
draftParts.AutosaveStatus;

// 4. A form without validation: status and events need no validation behavior
type LeanApi<Values> = {
  readonly values: ValuesApi<Values>;
  readonly status: StatusApi<Values>;
  readonly events: EventsApi<Values>;
};
type LeanOptions<Values> = { readonly defaultValues: Values };
interface LeanKind extends FormKind {
  readonly options: LeanOptions<this['values']>;
  readonly state: {};
  readonly api: LeanApi<this['values']>;
  readonly parts: {};
}
export const lean = defineForm<LeanKind>({
  name: 'lean',
  options: { defaultValues: 'value' },
  api: ctx => {
    const change = createChange(ctx);
    const values = createValues(ctx, { change });
    const status = createFieldStatus(ctx, {});
    const events = createFieldEvents(ctx, { values, status });
    return { values, status, events };
  },
});

// The extension needs validation, so the lean form is rejected
// @ts-expect-error lean form has no validation
autosave(lean);

// 5. Reusable slots check their needs against the form
const fieldSlots = defineSlots((slot: SlotFactory<{ readonly events: EventsApi<any> }, {}>) => ({
  field: slot({
    props: { name: 'key' },
    on: { input: (event, { api, key }) => api.events.change(key, (event.target as HTMLInputElement).value) },
  }),
}));

interface FieldKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: { readonly events: EventsApi<any> };
  readonly parts: { readonly field: PartSpec<{ readonly name: string }> };
}
export const withEvents = defineForm<FieldKind>({
  name: 'with-events',
  options: {},
  api: () => ({}) as never,
  slots: slot => ({ ...fieldSlots(slot) }),
});

interface NoEventsKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: { readonly values: ValuesApi<any> };
  readonly parts: { readonly field: PartSpec<{ readonly name: string }> };
}
export const withoutEvents = defineForm<NoEventsKind>({
  name: 'without-events',
  options: {},
  api: () => ({}) as never,
  // @ts-expect-error the form's api has no `events`
  slots: slot => ({ ...fieldSlots(slot) }),
});

// 6. Lifecycle hooks
const form = configureForm(standardForm, { schema: accountSchema, defaultValues: accountDefaults })();
form.submit.intercept(attempt => {
  if (attempt.values.name === '') attempt.cancel();
});
form.submit.onResult(result => result.issues.error.length);
form.validation.onRun(run => run.valid && run.issues.error.length);
