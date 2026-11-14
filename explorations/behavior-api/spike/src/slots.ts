import type { CheckState, EventsApi, SlotFactory, StatusState } from '../../api';
import { defineSlots } from './form';
import { getAt } from './paths';

/** Pure helpers for slot bodies, which read plain state. */
export const get = getAt as unknown as typeof import('../../api').get;
export const idPart = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, '-');

/** field -> <input>. Needs `events` and the values, status and `error` slices of the state. */
export const fieldSlots = defineSlots(
  (slot: SlotFactory<{ events: EventsApi<any> }, { values: unknown; status: StatusState; error: CheckState }>) => ({
    field: slot({
      props: { name: 'key' },
      attrs: (state, part) => {
        const status = state.status.fields[part.key];
        const invalid = (state.error[part.key] ?? []).length > 0;

        return {
          value: get(state.values, part.key) as string,
          'aria-invalid': !status?.valid || undefined,
          'aria-describedby': invalid ? `${part.id}-${idPart(part.key)}-error` : undefined,
          'data-dirty': status?.dirty ? '' : undefined,
          'data-touched': status?.touched ? '' : undefined,
          'data-blurred': status?.blurred ? '' : undefined,
        };
      },
      on: {
        input: (event, { api, key }) => api.events.change(key, (event.target as HTMLInputElement).value),
        focus: (_event, { api, key }) => api.events.focus(key),
        blur: (_event, { api, key }) => api.events.blur(key),
      },
      bind: (element, part) => {
        part.api.events.register(part.key)(element);
        return () => part.api.events.unregister(part.key);
      },
    }),
  }),
);

/** fieldError -> <p>. Renders nothing while the path has no errors. */
export const fieldErrorSlots = defineSlots((slot: SlotFactory<{}, { error: CheckState }>) => ({
  fieldError: slot({
    props: { name: 'key' },
    present: (state, part) => (state.error[part.key] ?? []).length > 0,
    state: (state, part) => ({ messages: (state.error[part.key] ?? []).map(entry => entry.message) }),
    attrs: (_state, part) => ({ id: `${part.id}-${idPart(part.key)}-error`, role: 'alert' }),
  }),
}));

/** submit -> <button>. Disabled while submitting. Its `type: 'submit'` triggers the root's submit handler. */
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

/** reset -> <button>. Its `type: 'reset'` triggers the root's reset handler. */
export const resetSlots = defineSlots((slot: SlotFactory<{}, {}>) => ({
  reset: slot({ attrs: () => ({ type: 'reset' }) }),
}));
