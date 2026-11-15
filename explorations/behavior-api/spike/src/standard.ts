import type { FormContext, FormInstance, StandardApi, StandardKind, StandardOptions, StandardState } from '../../api';
import { createArray } from './arrays';
import { createChange } from './change';
import { createCheck } from './check';
import { createFieldEvents } from './events';
import { defineForm } from './form';
import { createHandles } from './handles';
import { createReset } from './reset';
import { fieldErrorSlots, fieldSlots, resetSlots, submitSlots } from './slots';
import { createFieldStatus } from './status';
import { createSubmit } from './submit';
import { createValidation } from './validation';
import { createValues } from './values';

/** Written generic in `Values` and annotated with the kind's api, so the kind and the composition cannot drift. */
export const standardApi = <Values>(
  ctx: FormContext<StandardOptions<Values>, StandardState<Values>>,
): StandardApi<Values> => {
  const change = createChange<Values>(ctx);
  const values = createValues(ctx, { change });
  const validation = createValidation<Values, 'error'>(ctx, { values });
  const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
  const status = createFieldStatus(ctx, { validation, values });
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

/** The preset: one composition among many, built only from the kernel's behaviors. Slots are not part of the spike. */
export const standardForm = defineForm<StandardKind>({
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
  api: ctx => standardApi(ctx),

  slots: slot => ({
    // The preset owns only `root`, which connects submit and reset. Browser default submission needs preventDefault.
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
    ...fieldSlots(slot),
    ...fieldErrorSlots(slot),
    ...submitSlots(slot),
    ...resetSlots(slot),
  }),
});
