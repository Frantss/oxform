import { getAt, isWithin } from '#internal/paths';
import { defineSlots } from '#main/form';
import { idPart } from '#main/path';
import type { PartDomProps, PartHandle, SlotFactory } from '#main/types';
import type { CheckState } from './check';
import type { EventsApi } from './events';
import type { ResetApi } from './reset';
import type { StatusState } from './status';
import type { SubmitApi } from './submit';
import type { ValuesApi } from './values';

type FieldElement = HTMLInputElement & Pick<HTMLSelectElement, 'selectedOptions'>;

const isToggle = (element: FieldElement) => element.type === 'checkbox' || element.type === 'radio';

/** The value of an input by its DOM type. A file input gives its `File`, or a list of them when `multiple`. */
const valueOfInput = (element: FieldElement) => {
  switch (element.type) {
    case 'checkbox':
      return element.checked;
    case 'number':
    case 'range':
      return element.value === '' ? undefined : element.valueAsNumber;
    case 'file':
      return element.multiple ? Array.from(element.files ?? []) : (element.files?.[0] ?? null);
    case 'select-multiple':
      return Array.from(element.selectedOptions, option => option.value);
    default:
      return element.value;
  }
};

/** The attributes that show the value, by the `type` of the part. A radio also gives its own `value`. */
const valueAttributes = (value: unknown, { type, value: own }: PartDomProps) => {
  if (type === 'checkbox') return { checked: Boolean(value) };
  if (type === 'radio') return { checked: value === own, value: own };
  if (type === 'file') return {};
  return { value: (value ?? '') as string };
};

/** The id of a field element: the form id and the path, as `FieldState.id` gives it (G10). */
const fieldId = (part: PartHandle<unknown, unknown>) => `${part.id}-${idPart(part.key)}`;

type FieldApi = { readonly events: EventsApi<any>; readonly values: ValuesApi<any> };
type FieldState = { readonly values: unknown; readonly status: StatusState };

/**
 * The `field` slot of `fieldSlots` and `fieldErrorSlots`. `describedBy` gives the id of the element that describes
 * the field, or `undefined`. The `type` of the part, and the `value` of a radio, reach `attrs` through `part.props`.
 */
const fieldSlot = <State extends FieldState>(
  slot: SlotFactory<FieldApi, State>,
  describedBy: (state: State, part: PartHandle<unknown, unknown>) => string | undefined,
) =>
  slot({
    element: 'input',
    props: { name: 'key' },
    attrs: (state, part) => {
      const status = state.status.fields[part.key];
      return {
        id: fieldId(part),
        name: part.key,
        ...valueAttributes(getAt(state.values, part.key), part.props),
        'aria-invalid': status?.valid === false || undefined,
        'aria-describedby': describedBy(state, part),
        'data-dirty': status?.dirty ? '' : undefined,
        'data-touched': status?.touched ? '' : undefined,
        'data-blurred': status?.blurred ? '' : undefined,
      };
    },
    on: {
      input: (_event, { api, key, element }) => {
        const input = element as FieldElement;
        if (!isToggle(input)) api.events.change(key, valueOfInput(input));
      },
      // A toggle is read on `click`: React puts a controlled one back on `click`, before its `input` event fires.
      click: (_event, { api, key, element }) => {
        const input = element as FieldElement;
        if (isToggle(input)) api.events.change(key, valueOfInput(input));
      },
      focus: (_event, { api, key }) => api.events.focus(key),
      blur: (_event, { api, key }) => api.events.blur(key),
    },
    bind: (element, part) => {
      part.api.events.register(part.key)(element);
      // A file input cannot be controlled, so a reset empties it.
      const input = element as FieldElement;
      const stop = part.api.values.onChange((change, { reason }) => {
        if (reason === 'reset' && input.type === 'file' && isWithin(part.key, change.path)) input.value = '';
      });
      return () => {
        stop();
        part.api.events.unregister(part.key);
      };
    },
  });

/** `field` -> `<input>`, `<select>` or `<textarea>`: the value, the status flags and the events of a path. */
export const fieldSlots = /* @__PURE__ */ defineSlots(
  { name: 'fieldSlots', needs: { api: ['events', 'values'], state: ['values', 'status'] } },
  (slot: SlotFactory<FieldApi, FieldState>) => ({ field: fieldSlot(slot, () => undefined) }),
);

const hasErrors = (state: { readonly error: CheckState }, key: string) => (state.error[key] ?? []).length > 0;

/**
 * The `field` part of `fieldSlots`, described by the `fieldError` part while the path has errors. `fieldError` ->
 * `<p>`: present only while the path has entries of the `error` check, and it shows the first message.
 */
export const fieldErrorSlots = /* @__PURE__ */ defineSlots(
  { name: 'fieldErrorSlots', needs: { api: ['events', 'values'], state: ['values', 'status', 'error'] } },
  (slot: SlotFactory<FieldApi, FieldState & { readonly error: CheckState }>) => ({
    field: fieldSlot(slot, (state, part) => (hasErrors(state, part.key) ? `${fieldId(part)}-error` : undefined)),
    fieldError: slot({
      element: 'p',
      props: { name: 'key' },
      text: ({ messages }) => messages[0],
      present: (state, part) => hasErrors(state, part.key),
      state: (state, part) => ({ messages: (state.error[part.key] ?? []).map(entry => entry.message) }),
      attrs: (_state, part) => ({ id: `${fieldId(part)}-error`, role: 'alert' }),
    }),
  }),
);

/** `submit` -> `<button>`: disabled while submitting. Its `type="submit"` makes the root submit. */
export const submitSlots = /* @__PURE__ */ defineSlots(
  { name: 'submitSlots', needs: { state: ['status'] } },
  (slot: SlotFactory<{}, { readonly status: StatusState }>) => ({
    submit: slot({
      element: 'button',
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
  }),
);

/** `reset` -> `<button>`: a click resets the form. */
export const resetSlots = /* @__PURE__ */ defineSlots(
  { name: 'resetSlots', needs: { api: ['reset'] } },
  (slot: SlotFactory<{ readonly reset: ResetApi<any> }, {}>) => ({
    reset: slot({
      element: 'button',
      attrs: () => ({ type: 'reset' }),
      on: {
        click: (event, { api }) => {
          event.preventDefault();
          api.reset.all();
        },
      },
    }),
  }),
);

/**
 * `root` -> `<form>`: a submit of the browser runs `submit.run` with the `value` of the button that submitted. The
 * root prevents the default of `submit`, and of `reset`, so the browser never resets a controlled input. When
 * `submit.run` rejects, the status already holds the failed submit, and the root reports the error as an error of
 * an event handler (G16).
 */
export const rootSlots = /* @__PURE__ */ defineSlots(
  { name: 'rootSlots', needs: { api: ['submit'] } },
  (slot: SlotFactory<{ readonly submit: SubmitApi<any, any> }, {}>) => ({
    root: slot({
      element: 'form',
      on: {
        submit: (event, { api }) => {
          event.preventDefault();
          api.submit
            .run((event.submitter as HTMLButtonElement | null)?.value || undefined)
            .catch((error: unknown) => reportError(error));
        },
        reset: event => event.preventDefault(),
      },
    }),
  }),
);
