// SKETCH: none of these APIs exist and this file is not compiled. The types are in api.ts and type-tests/.
//
// A check is a named set of issues by path, filled by event validators. `createCheck` is generic.
// The preset's `error` is one check: blocking and exclusive. Nothing in the kernel treats it specially.
//
// Part 1: the preset's error check and event validation.
// Part 2: more levels are more `createCheck` calls, packaged as an extension.
// Part 3: a lean form with validation.
// Part 4: a minimal form with no validation, no schema and no checks.

import {
  configureForm,
  createChange,
  createCheck,
  createFieldEvents,
  createFieldStatus,
  createSubmit,
  createValidation,
  createValues,
  defineExtension,
  defineForm,
  fieldSlots,
  submitSlots,
  type CheckApi,
  type EventValidators,
  type EventsApi,
  type FormKind,
  type PartSpec,
  type StatusApi,
  type StatusState,
  type SubmitApi,
  type ValidationApi,
  type ValuesApi,
} from '@oxform/core';
import { standardForm } from '@oxform/core/standard';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import z from 'zod';

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  card: z.object({ number: z.string(), cvc: z.string() }),
});

// Part 1: the preset.
const checkout = configureForm(standardForm, {
  schema,
  defaultValues: { email: '', password: '', card: { number: '', cvc: '' } },
  error: {
    change: schema, // refreshes errors for the changed path
    submit: schema, // optional: the root schema is the submit fallback
    blur: store => passwordRulesSchema(store.values), // a function receives the store and returns a schema
  },
});

const form = checkout();

// Run validity covers this run only. `form.status.form.valid` covers every current blocking issue.
// Results are grouped by check name, so `issues.error` is the same list the old API returned.
const [valid, issues] = await form.validation.run('card', { type: 'blur' }); // descendants included
await form.validation.run(['email', 'password']);
await form.validation.run(); // root schema and every event

// Async validators set `status.form.validating`. A value change, a newer run for the same scope and
// event, or a reset discards stale results. The discarded run resolves [true, {}].
// Entries are Standard Schema issues ({ message, path? }). The check adds `type` (the event) itself,
// because per-event refresh needs it.
form.error.at('email'); // the check instance, by path
form.error.set('email', [{ message: 'Already registered' }], { mode: 'append' }); // replace | append | keep
form.error.at('card', { nested: true });
form.field('email').error(); // sugar from createHandles, for the checks it was given
form.field('email').setError([{ message: 'Already registered' }]);

// Observe runs, for example to log them. Every run is reported, including those started by events and submit.
form.validation.onRun(run => console.info(run.type, run.valid, run.issues.error.length));

// Part 2: levels. Each call adds a check with its own issues and blocking flag. A check reads the option
// named after it. Today's `checks: { warning: { validate: {...} } }` becomes one option per check.
// The extension states its kind, because its options and api depend on `Values`, and what it needs from a form.
type ChecksOptions<Values> = {
  readonly warning?: EventValidators<Values>;
  readonly notice?: EventValidators<Values>;
  readonly risk?: EventValidators<Values>;
};
type ChecksApi<Values> = {
  readonly warning: CheckApi<Values, 'warning'>;
  readonly notice: CheckApi<Values, 'notice'>;
  readonly risk: CheckApi<Values, 'risk'>;
};
interface ChecksKind extends FormKind {
  readonly options: ChecksOptions<this['values']>;
  readonly state: {};
  readonly api: ChecksApi<this['values']>;
  readonly parts: {};
}

export const withChecks = defineExtension<{ values: ValuesApi<any>; validation: ValidationApi<any> }, ChecksKind>({
  name: 'checks',
  options: { warning: 'value', notice: 'value', risk: 'value' },
  // The api returns only the additions. The result is merged with the base form's api.
  api: (ctx, { values, validation }) => ({
    warning: createCheck(ctx, { values, validation }, { name: 'warning' }), // reads option `warning`, does not block
    notice: createCheck(ctx, { values, validation }, { name: 'notice' }),
    risk: createCheck(ctx, { values, validation }, { name: 'risk', blocking: true }),
  }),
});

const order = configureForm(withChecks(standardForm), {
  schema,
  defaultValues: { email: '', password: '', card: { number: '', cvc: '' } },
  error: { change: schema, submit: schema },
  warning: { blur: store => weakPasswordSchema(store.values) },
  notice: { focus: noticeSchema },
  risk: { submit: stockSchema }, // async Standard Schema
});

const orderForm = order();
const [, grouped] = await orderForm.validation.run(undefined, { type: 'submit' }); // runs every registered check
grouped.risk; // typed: one key per registered check
orderForm.warning.set('email', [{ message: 'Disposable domain' }], { mode: 'append' });
orderForm.warning.at('card', { nested: true });

// Part 3: a lean login form with validation. It composes only what it needs, and states its own kind.
type LoginOptions<Values> = {
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
  readonly error?: EventValidators<Values>;
  readonly onSubmit?: (values: Values) => unknown;
};
type LoginState = { readonly status: StatusState; readonly error: Record<string, readonly { message: string }[]> };
type LoginApi<Values> = {
  readonly values: ValuesApi<Values>;
  readonly error: CheckApi<Values, 'error'>;
  readonly validation: ValidationApi<Values, 'error'>;
  readonly status: StatusApi<Values>;
  readonly events: EventsApi<Values>;
  readonly submit: SubmitApi<Values, 'error'>;
};
interface LoginKind extends FormKind {
  readonly options: LoginOptions<this['values']>;
  readonly state: LoginState;
  readonly api: LoginApi<this['values']>;
  readonly parts: { readonly field: PartSpec<{ readonly name: string }>; readonly submit: PartSpec };
}

export const loginForm = defineForm<LoginKind>({
  name: 'login',
  options: { schema: 'value', defaultValues: 'value', error: 'value', onSubmit: 'action' },
  api: ctx => {
    const change = createChange(ctx);
    const values = createValues(ctx, { change });
    const validation = createValidation(ctx, { values });
    const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
    const status = createFieldStatus(ctx, { validation });
    const events = createFieldEvents(ctx, { values, status, validation });
    const submit = createSubmit(ctx, { validation, status });

    return { values, error, validation, status, events, submit };
  },
  // The same slot groups the preset uses. A group fails to compile if this form lacks what it needs.
  slots: slot => ({
    ...fieldSlots(slot),
    ...submitSlots(slot),
  }),
});

// Part 4: a minimal form. No schema, no validation, no checks, no arrays, no reset.
// Status and events take `validation` as an optional dependency, so they work without it.
type MinimalOptions<Values> = { readonly defaultValues: Values };
type MinimalApi<Values> = {
  readonly values: ValuesApi<Values>;
  readonly status: StatusApi<Values>;
  readonly events: EventsApi<Values>;
};
interface MinimalKind extends FormKind {
  readonly options: MinimalOptions<this['values']>;
  readonly state: {};
  readonly api: MinimalApi<this['values']>;
  readonly parts: {};
}

export const minimalForm = defineForm<MinimalKind>({
  name: 'minimal',
  options: { defaultValues: 'value' },
  api: ctx => {
    const change = createChange(ctx);
    const values = createValues(ctx, { change });
    const status = createFieldStatus(ctx, {}); // `valid` is always true: no check is registered
    const events = createFieldEvents(ctx, { values, status });

    return { values, status, events };
  },
});
