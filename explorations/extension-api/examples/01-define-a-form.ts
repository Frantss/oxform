// Type-checked: `tsc -p examples/tsconfig.json`. The types are in spike/src/api.ts and type-tests/.
//
// Entry points:
//   @oxform/core            the kernel: defineForm, defineExtension, option, on, kernel extensions, slot groups
//   @oxform/core/standard   `standard`, a suggested preset made only from the kernel's public API
//
// A form is a base (`defineForm`) plus an ordered list of extensions (`form.extend`). Each kernel behavior is one
// extension, so a lean form extends fewer of them. `standard` has no special access: anyone can write an equivalent
// preset, drop an extension, or add one. Same shape as UI SDK's definePrimitive: name, options, state, api(context), slots.
// An extension is a function of the form so far. Its first argument states `Values` and what it needs, and that is the
// only place it names a dependency. Needs are checked at `.extend`, and `api` receives them as `deps`.
// Everything an extension adds is inferred from its object: no hand-written kind.
// Checks register themselves with `validation`. That is the only implicit link.
//
// Part 1: a kernel extension in full, `values`, and `check`, an extension factory.
// Part 2: slot groups, exported by @oxform/core. Each is its own export, so an unused group is tree-shaken.
// A group states what it needs from a form. An extension that spreads it must provide that api and state, or it
// fails to compile. Slots never name an element. `attrs` may imply one (`type: 'submit'` implies a button),
// and the adapter chooses the tag, as in UI SDK:
//   createParts(form, { root: 'form', field: 'input', fieldError: 'p', submit: 'button', reset: 'button' })
// Slot bodies read plain state, never methods on it, so `attrs` and `state` stay pure and server-safe.
// Part 3: the preset. Source of `@oxform/core/standard`.

import {
  arrays,
  check,
  createChange,
  createCheck,
  createValues,
  defineExtension,
  defineSlots,
  events,
  get,
  handles,
  idPart,
  option,
  reset,
  slots,
  status,
  submit,
  validation,
  values,
  type CheckApi,
  type CheckState,
  type EventValidators,
  type EventsApi,
  type Extendable,
  type Form,
  type Needs,
  type OptionDescriptor,
  type SlotFactory,
  type StatusState,
} from '@oxform/core';

// Each kernel behavior is exported as an extension (`values`, `validation`, `check`, `status`, `events`, `arrays`,
// `reset`, `submit`, `handles`). The two below show how they are written. The exports are the same shape.
//
// Part 1: `values`. It needs nothing. Its state starts from `defaultValues`, which every form has.
// `createValues` is the behavior. `ctx.state.values` is the slice that the `state` factory declared.
export const valuesExample = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'values',
    state: options => ({ values: options.defaultValues }),
    api: ctx => ({ values: createValues(ctx, { change: createChange<Values>() }) }), // one pipeline for every change
  });

// `check`: a named set of issues by path, filled by event validators. It is a factory, because the check's name is
// the name of its option, its state key and its api key. A check reads the option named after it.
// The preset's `error` is one check: it blocks, and its validator replaces every issue in scope (`exclusive`).
// Nothing in the kernel treats it specially. More levels are more `.extend(check(...))` calls (03).
type CheckConfig = { readonly blocking?: boolean; readonly exclusive?: boolean };

export const checkExample =
  <const Name extends string>(name: Name, config: CheckConfig = {}) =>
  <Values>(form: Extendable<Values, Needs<Values, 'values' | 'validation'>>) =>
    defineExtension(form, {
      name: `check:${name}`,
      // Computed keys lose their literal type, so the three records are cast to the name.
      options: { [name]: option.value<EventValidators<Values>>() } as Record<
        Name,
        OptionDescriptor<EventValidators<Values>, 'value'>
      >,
      state: () => ({ [name]: {} }) as Record<Name, CheckState>,
      api: (ctx, deps) =>
        ({ [name]: createCheck(ctx, deps, { name, ...config }) }) as Record<Name, CheckApi<Values, Name>>,
    });

// Part 2: slot groups.

// field -> <input>. Needs `events` and the values, status and `error` state slices.
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

// Part 3: the preset. Its extensions are applied in order, and each one's needs are checked against the ones before it.
// Hooks registered through `values.intercept`, `submit.intercept` and similar run in that same order.

// The only slot the preset owns is `root`, because it ties two behaviors together. The rest are groups that spread in.
// The last step adds slots and no api, so it is `slots(...)`: it declares no needs, `slot` is typed by the form so far.
// A preset is a function from form to form, so `form.extend(standard)` applies it. Its generic parameters only carry
// the form's types through. Instance keys: behaviors keep their own name (`values`, `validation`, `arrays`, ...).
// `field(name)`, `array(name)` and `scope(prefix)` are bound handles built by `handles`.
export const standard = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) =>
  form
    .extend(values) // state: values
    .extend(validation) // lanes, `validating`, run(targets, { type }); runs registered checks
    .extend(check('error', { blocking: true, exclusive: true }))
    .extend(status) // field and form status; `valid` reads the validation's blocking checks
    .extend(events) // change, focus, blur, register
    .extend(arrays) // append, move, swap, ...
    .extend(reset) // `events` lets it clear refs
    .extend(submit) // options: onSubmit, onInvalid. Both are awaited, so both are actions
    .extend(handles) // field, array and scope, with sugar for the checks it finds
    .extend(
      slots(slot => ({
        // root -> <form>
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
      })),
    );
