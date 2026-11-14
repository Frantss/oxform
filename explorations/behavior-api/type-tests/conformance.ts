import {
  type FormContext,
  type FormInstance,
  type StandardApi,
  type StandardKind,
  type StandardOptions,
  type StandardState,
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
  get,
  idPart,
} from '../api';

// Conformance: the api is written generic in `Values` and annotated with the kind's api type. If the kind
// and the composition drift apart, this fails to compile. `defineForm` itself only checks at `Values = any`.
export const standardApi = <Values>(
  ctx: FormContext<StandardOptions<Values>, StandardState<Values>>,
): StandardApi<Values> => {
  const change = createChange<Values>(ctx);
  const values = createValues(ctx, { change });
  const validation = createValidation<Values, 'error'>(ctx, { values });
  const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
  const status = createFieldStatus(ctx, { values, validation });
  const events = createFieldEvents(ctx, { values, status, validation });
  const arrays = createArray(ctx, { values, status, validation });
  const reset = createReset(ctx, { values, status, validation, events });
  const submit = createSubmit<Values, 'error', FormInstance<StandardKind, Values>>(ctx, {
    values,
    validation,
    status,
  });
  const { field, array, scope } = createHandles(ctx, { values, status, events, reset, arrays, checks: { error } });

  return { values, error, status, validation, events, arrays, reset, submit, field, array, scope };
};

// A drifted composition (here: no `scope`) is rejected at generic `Values`.
export const drifted = <Values>(
  ctx: FormContext<StandardOptions<Values>, StandardState<Values>>,
): StandardApi<Values> => {
  const { scope: _scope, ...rest } = standardApi(ctx);
  // @ts-expect-error missing `scope`
  return rest;
};

export const preset = defineForm<StandardKind>({
  name: 'form',
  options: {
    id: 'id',
    schema: 'value',
    defaultValues: 'value',
    error: 'value',
    defaultStatus: 'value',
    defaultFieldStatus: 'value',
    onSubmit: 'action',
    onInvalid: 'action',
  },

  api: ctx => {
    const change = createChange(ctx);
    const values = createValues(ctx, { change });
    const validation = createValidation<any, 'error'>(ctx, { values });
    const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
    const status = createFieldStatus(ctx, { values, validation });
    const events = createFieldEvents(ctx, { values, status, validation });
    const arrays = createArray(ctx, { values, status, validation });
    const reset = createReset(ctx, { values, status, validation, events });
    const submit = createSubmit<any, 'error', FormInstance<StandardKind, any>>(ctx, { values, validation, status });
    const { field, array, scope } = createHandles(ctx, { values, status, events, reset, arrays, checks: { error } });

    return { values, error, status, validation, events, arrays, reset, submit, field, array, scope };
  },

  slots: slot => ({
    root: slot({
      on: {
        submit: (event, { api }) => {
          event.preventDefault();
          void api.submit.run();
        },
        reset: (event, { api }) => {
          event.preventDefault();
          api.reset.all();
        },
      },
    }),

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

    fieldError: slot({
      props: { name: 'key' },
      present: (state, part) => (state.error[part.key] ?? []).length > 0,
      state: (state, part) => ({ messages: (state.error[part.key] ?? []).map(entry => entry.message) }),
      attrs: (_state, part) => ({ id: `${part.id}-${idPart(part.key)}-error`, role: 'alert' }),
    }),

    submit: slot({
      state: state => ({
        submitting: state.status.form.submitting,
        submits: state.status.form.submits,
        successful: state.status.form.successful,
      }),
      attrs: state => ({ type: 'submit', disabled: state.status.form.submitting || undefined }),
    }),

    reset: slot({ attrs: () => ({ type: 'reset' }) }),
  }),
});
