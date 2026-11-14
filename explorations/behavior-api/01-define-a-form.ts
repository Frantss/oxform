// SKETCH: none of these APIs exist and this file is not compiled. The types are in api.ts and type-tests/.
//
// Entry points:
//   @oxform/core            the kernel: defineForm, context, behaviors, slot groups
//   @oxform/core/standard   `standardForm`, a suggested preset made only from the kernel's public API
//
// `standardForm` has no special access. Anyone can write an equivalent file, drop a behavior, or add one.
// Same shape as UI SDK's definePrimitive: name, options, api(context), slots.
// Behaviors are created inside `api` with one shared context, so they share one store.
// Dependencies between behaviors are passed as plain arguments. Nothing is looked up implicitly.
// Checks register themselves with `validation`. That is the only implicit link.
// Status, events, arrays, reset and submit take `validation` as an optional dependency (see 03).
//
// Part 1: slot groups, exported by @oxform/core. Each is its own export, so an unused group is tree-shaken.
// A group states what it needs from a form. A form that spreads it must provide that api and state, or it
// fails to compile. Slots never name an element. `attrs` may imply one (`type: 'submit'` implies a button),
// and the adapter chooses the tag, as in UI SDK:
//   createParts(form, { root: 'form', field: 'input', fieldError: 'p', submit: 'button', reset: 'button' })
// Slot bodies read plain state, never methods on it, so `attrs` and `state` stay pure and server-safe.

import {
  createArray,
  createChange,
  createCheck,
  createFieldEvents,
  createFieldStatus,
  createHandles,
  createReset,
  createSubmit,
  createValidation,
  createValues,
  defineForm,
  defineSlots,
  get,
  idPart,
  type CheckState,
  type EventsApi,
  type SlotFactory,
  type StandardKind,
  type StatusState,
} from '@oxform/core';

// field -> <input>. Needs `events` and the values, status and `error` check slices.
export const fieldSlots = defineSlots(
  (slot: SlotFactory<{ events: EventsApi<any> }, { values: unknown; status: StatusState; error: CheckState }>) => ({
    field: slot({
      props: { name: 'key' },
      attrs: (state, part) => {
        const status = state.status.fields[part.key];
        const invalid = (state.error[part.key] ?? []).length > 0;

        return {
          value: get(state.values, part.key) as string,
          'aria-invalid': !status.valid || undefined,
          'aria-describedby': invalid ? `${part.id}-${idPart(part.key)}-error` : undefined,
          'data-dirty': status.dirty ? '' : undefined,
          'data-touched': status.touched ? '' : undefined,
          'data-blurred': status.blurred ? '' : undefined,
        };
      },
      on: {
        input: (event, { api, key }) => api.events.change(key, (event.target as HTMLInputElement).value),
        focus: (_event, { api, key }) => api.events.focus(key),
        blur: (_event, { api, key }) => api.events.blur(key),
      },
      bind: (element, part) => {
        part.api.events.register(part.key)(element);
      },
    }),
  }),
);

// fieldError -> <p>. Renders nothing while the path has no errors, like UI SDK's `present`.
// Children may be a function of the slot state: <FieldError name='email'>{({ messages }) => messages[0]}</FieldError>
export const fieldErrorSlots = defineSlots((slot: SlotFactory<{}, { error: CheckState }>) => ({
  fieldError: slot({
    props: { name: 'key' },
    present: (state, part) => (state.error[part.key] ?? []).length > 0,
    state: (state, part) => ({ messages: (state.error[part.key] ?? []).map(entry => entry.message) }),
    attrs: (_state, part) => ({ id: `${part.id}-${idPart(part.key)}-error`, role: 'alert' }),
  }),
}));

// submit -> <button>. Disabled while submitting. Its `type: 'submit'` triggers the root's submit handler.
// Children may be a function of the slot state: <Submit>{({ submitting }) => (submitting ? 'Saving' : 'Save')}</Submit>
export const submitSlots = defineSlots((slot: SlotFactory<{}, { status: StatusState }>) => ({
  submit: slot({
    state: state => ({
      submitting: state.status.form.submitting,
      submits: state.status.form.submits,
      successful: state.status.form.successful,
    }),
    attrs: state => ({
      type: 'submit',
      disabled: state.status.form.submitting || undefined,
      'data-submitting': state.status.form.submitting ? '' : undefined,
    }),
  }),
}));

// reset -> <button>. Its `type: 'reset'` triggers the root's reset handler.
export const resetSlots = defineSlots((slot: SlotFactory<{}, {}>) => ({
  reset: slot({ attrs: () => ({ type: 'reset' }) }),
}));

// Part 2: the preset. Source of `@oxform/core/standard`.
// `defineForm` takes the form's kind (StandardKind in api.ts) as a type argument. The kind maps `Values` to the
// options, state, api and parts. It cannot be inferred from this implementation.

export const standardForm = defineForm<StandardKind>({
  name: 'form',

  // Option kinds tell adapters how to pass each option, as in UI SDK.
  options: {
    id: 'id', // generated by the adapter, so server and client agree
    schema: 'value',
    defaultValues: 'value',
    error: 'value', // { change, blur, focus, submit }. A check reads the option named after it.
    defaultStatus: 'value',
    defaultFieldStatus: 'value',
    onSubmit: 'action', // both handlers are awaited, so both are actions
    onInvalid: 'action',
  },

  // Instance keys: behaviors keep their own name (`values`, `validation`, `arrays`, ...).
  // `field(name)`, `array(name)` and `scope(prefix)` are bound handles built by `createHandles`.
  api: ctx => {
    const change = createChange(ctx); // one pipeline for every value change
    const values = createValues(ctx, { change }); // slice: values
    const validation = createValidation(ctx, { values }); // lanes, `validating`, run(targets, { type }); runs registered checks
    // A check is a named set of issues by path, filled by event validators. `error` is one check, nothing special:
    // it blocks, and its validator replaces every issue in scope (`exclusive`). Add more levels with more calls (03).
    const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
    const status = createFieldStatus(ctx, { validation }); // field and form status; `valid` derives from blocking checks
    const events = createFieldEvents(ctx, { values, status, validation }); // change, focus, blur, register
    const arrays = createArray(ctx, { values, status, validation }); // append, move, swap, ...
    const reset = createReset(ctx, { values, status, validation });
    const submit = createSubmit(ctx, { validation, status });
    const { field, array, scope } = createHandles(ctx, { events, reset, arrays, checks: { error } });

    return { values, error, status, validation, events, arrays, reset, submit, field, array, scope };
  },

  slots: slot => ({
    // root -> <form>. The only slot the preset owns, because it ties two behaviors together.
    root: slot({
      on: {
        submit: (event, { api }) => {
          event.preventDefault(); // a choice of this preset, not of the library
          void api.submit.run();
        },
        reset: (event, { api }) => {
          event.preventDefault();
          api.reset.all();
        },
      },
    }),
    ...fieldSlots(slot), // field -> <input>
    ...fieldErrorSlots(slot), // fieldError -> <p>
    ...submitSlots(slot), // submit -> <button>
    ...resetSlots(slot), // reset -> <button>
  }),
});
