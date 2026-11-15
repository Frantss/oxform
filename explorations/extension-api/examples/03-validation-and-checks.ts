// Type-checked: `tsc -p examples/tsconfig.json`. The types are in spike/src/api.ts and type-tests/.
//
// A check is a named set of issues by path, filled by event validators. `check(name)` is an extension factory.
// The preset's `error` is one check: blocking and exclusive. Nothing in the kernel treats it specially.
//
// Part 1: the preset's error check and event validation.
// Part 2: more levels are more `.extend(check(...))` calls.
// Part 3: a lean form with validation.
// Part 4: a minimal form with no validation and no checks.

import {
  check,
  defineForm,
  events,
  fieldErrorSlots,
  fieldSlots,
  slots,
  status,
  submit,
  submitSlots,
  validation,
  values,
} from '@oxform/core';
import { standard } from '@oxform/core/standard';
import z from 'zod';

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  card: z.object({ number: z.string(), cvc: z.string() }),
});
const defaultValues = { email: '', password: '', card: { number: '', cvc: '' } };

// Part 1: the preset.
// The `error` check reads the option named after it, so its validators are the form's defaults: `configure`.
const checkout = defineForm({ name: 'checkout', schema, defaultValues })
  .extend(standard)
  .configure({
    error: {
      change: schema, // refreshes errors for the changed path
      submit: schema, // the root `schema` only sets the data shape. Pass it here to validate on submit.
      blur: store => passwordRulesSchema(store.values), // a function receives the store and returns a schema
    },
  });
const form = checkout.create();

// Run validity covers this run only. `form.status.form.valid` covers every current blocking issue.
// Results are grouped by check name, so `issues.error` is the same list the old API returned.
const [valid, issues] = await form.validation.run('card', { type: 'blur' }); // descendants included
await form.validation.run(['email', 'password']);
await form.validation.run(); // every event of every check

// Async validators set `status.form.validating`. A value change, a newer run for the same scope and
// event, or a reset discards stale results. The discarded run resolves [true, {}].
// Entries are Standard Schema issues ({ message, path? }). The check adds `type` (the event) itself,
// because per-event refresh needs it.
form.error.at('email'); // the check instance, by path
form.error.set('email', [{ message: 'Already registered' }], { mode: 'append' }); // replace | append | keep
form.error.at('card', { nested: true });
form.field('email').error(); // sugar from `handles`, for the checks it finds
form.field('email').setError([{ message: 'Already registered' }]);

// Observe runs, for example to log them. Every run is reported, including those started by events and submit.
form.validation.onRun(run => console.info(run.type, run.valid, run.issues.error.length));

// Part 2: levels. Each `.extend(check(...))` adds a check with its own issues and blocking flag. A check reads the
// option named after it, so today's `checks: { warning: { validate: {...} } }` becomes one option per check.
// Each check needs `values` and `validation`, so it goes after `standard`. A form without them is a type error.
const order = defineForm({ name: 'order', schema, defaultValues })
  .extend(standard)
  .extend(check('warning')) // does not block
  .extend(check('notice'))
  .extend(check('risk', { blocking: true })) // `handles` was applied before, so it has no sugar for these
  .configure({ error: { change: schema, submit: schema } }); // after the checks, so their options are typed too

const orderForm = order.create({
  warning: { blur: store => weakPasswordSchema(store.values) },
  notice: { focus: noticeSchema },
  risk: { submit: stockSchema }, // async Standard Schema
});
const [, grouped] = await orderForm.validation.run(undefined, { type: 'submit' }); // runs every registered check
grouped.risk; // typed: one key per registered check
orderForm.warning.set('email', [{ message: 'Disposable domain' }], { mode: 'append' });
orderForm.warning.at('card', { nested: true });

// Part 3: a lean login form with validation. It extends only what it needs. Each extension's needs are checked in order.
// `slots(...)` adds slots and nothing else. It declares no needs: `slot` is typed by the form it is applied to, and a
// group fails to compile at its call if that form lacks the api or the state the group reads.

export const login = defineForm({
  name: 'login',
  schema: z.object({ email: z.email(), password: z.string() }),
  defaultValues: { email: '', password: '' },
})
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }))
  .extend(status)
  .extend(events)
  .extend(submit) // options: onSubmit, onInvalid
  .extend(slots(slot => ({ ...fieldSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot) })));

login.create({ onSubmit: values => save(values) });
// login.create().field('email')   // type error: no `handles`, so no field(path). Use `events.change(path, value)`.
// login.create().arrays          // type error: no `arrays`

// Part 4: a minimal form. No validation, no checks, no arrays, no reset. `defineForm` still takes a `schema`,
// which fixes `Values`. Nothing runs it unless `validation` is extended.
// Status and events take `validation` as an optional dependency, so they work without it.
export const minimal = defineForm({
  name: 'minimal',
  schema: z.object({ query: z.string() }),
  defaultValues: { query: '' },
})
  .extend(values)
  .extend(status) // `valid` is always true: no check is registered
  .extend(events);

// minimal.extend(check('error'))  // type error at `.extend`: `check` needs `validation`
