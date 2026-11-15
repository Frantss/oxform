import type {
  CheckState,
  EventsApi,
  PartDomProps,
  ResetApi,
  SlotFactory,
  StatusState,
  SubmitApi,
  ValuesApi,
} from './api';
import { defineSlots } from './form';
import { getAt, isWithin } from './paths';

/** Pure helpers for slot bodies, which read plain state. */
export const get = getAt as unknown as typeof import('./api').get;
export const idPart = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, '-');

type FieldElement = HTMLInputElement & Pick<HTMLSelectElement, 'selectedOptions'>;

const isToggle = (element: FieldElement) => element.type === 'checkbox' || element.type === 'radio';

/** The value an input holds, by its DOM type. A file input gives its `File`, or a list of them when `multiple`. */
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

/** The attributes that show a field's value, by the `type` given on the part. A radio also gives its own `value`. */
const valueAttrs = (value: unknown, { type, value: own }: PartDomProps) => {
  if (type === 'checkbox') return { checked: Boolean(value) };
  if (type === 'radio') return { checked: value === own, value: own };
  if (type === 'file') return {};
  return { value: (value ?? '') as string };
};

/**
 * field -> <input>, <select> or <textarea>. Needs `events` and `values`, and the values, status and `error` slices of the state.
 * The part's `type`, and a radio's `value`, reach `attrs` through `part.props` although the slot does not declare them.
 */
export const fieldSlots = defineSlots(
  (
    slot: SlotFactory<
      { events: EventsApi<any>; values: ValuesApi<any> },
      { values: unknown; status: StatusState; error: CheckState }
    >,
  ) => ({
    field: slot({
      element: 'input',
      props: { name: 'key' },
      attrs: (state, part) => {
        const status = state.status.fields[part.key];
        const invalid = (state.error[part.key] ?? []).length > 0;

        return {
          name: part.key,
          ...valueAttrs(get(state.values, part.key), part.props),
          'aria-invalid': !status?.valid || undefined,
          'aria-describedby': invalid ? `${part.id}-${idPart(part.key)}-error` : undefined,
          'data-dirty': status?.dirty ? '' : undefined,
          'data-touched': status?.touched ? '' : undefined,
          'data-blurred': status?.blurred ? '' : undefined,
        };
      },
      on: {
        input: (_event, { api, key, el }) => {
          const input = el as FieldElement;
          if (!isToggle(input)) api.events.change(key, valueOfInput(input));
        },
        // A toggle is read on `click`: React puts a controlled one back on `click`, before its `input` event fires.
        click: (_event, { api, key, el }) => {
          const input = el as FieldElement;
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
    }),
  }),
);

/** fieldError -> <p>. Renders nothing while the path has no errors. */
export const fieldErrorSlots = defineSlots((slot: SlotFactory<{}, { error: CheckState }>) => ({
  fieldError: slot({
    element: 'p',
    props: { name: 'key' },
    text: ({ messages }) => messages[0],
    present: (state, part) => (state.error[part.key] ?? []).length > 0,
    state: (state, part) => ({ messages: (state.error[part.key] ?? []).map(entry => entry.message) }),
    attrs: (_state, part) => ({ id: `${part.id}-${idPart(part.key)}-error`, role: 'alert' }),
  }),
}));

/** submit -> <button>. Disabled while submitting. Its `type: 'submit'` triggers the root's submit handler. */
export const submitSlots = defineSlots((slot: SlotFactory<{}, { status: StatusState }>) => ({
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
}));

/** reset -> <button>. Its `type: 'reset'` triggers the root's reset handler. */
export const resetSlots = defineSlots((slot: SlotFactory<{}, {}>) => ({
  reset: slot({ element: 'button', attrs: () => ({ type: 'reset' }) }),
}));

/**
 * root -> <form>. Connects the browser's submit and reset to the form. Needs `submit` and `reset`. A form without
 * this group has no `Root` part. Browser default submission needs `preventDefault`.
 */
export const rootSlots = defineSlots((slot: SlotFactory<{ submit: SubmitApi<any>; reset: ResetApi<any> }, {}>) => ({
  root: slot({
    element: 'form',
    on: {
      submit: (event, { api }) => {
        event.preventDefault();
        void api.submit.run((event.submitter as HTMLButtonElement | null)?.value || undefined);
      },
      reset: (event, { api }) => {
        event.preventDefault();
        api.reset.all();
      },
    },
  }),
}));
