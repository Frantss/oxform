import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  CheckApi,
  CheckState,
  EventValidators,
  EventsApi,
  FormContext,
  FormKind,
  PartSpec,
  StatusApi,
  StatusState,
  SubmitApi,
  SubmitPartState,
  ValidationApi,
  ValuesApi,
} from '../../../api';
import { createChange } from '../../../spike/src/change';
import { createCheck } from '../../../spike/src/check';
import { createFieldEvents } from '../../../spike/src/events';
import { defineForm } from '../../../spike/src/form';
import { fieldErrorSlots, fieldSlots, submitSlots } from '../../../spike/src/slots';
import { createFieldStatus } from '../../../spike/src/status';
import { createSubmit } from '../../../spike/src/submit';
import { createValidation } from '../../../spike/src/validation';
import { createValues } from '../../../spike/src/values';

type LeanOptions<Values> = {
  readonly id?: string;
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
  readonly error?: EventValidators<Values>;
  readonly onSubmit?: (values: Values) => unknown;
};
type LeanState<Values> = { readonly values: Values; readonly status: StatusState; readonly error: CheckState };
type LeanApi<Values> = {
  readonly values: ValuesApi<Values>;
  readonly error: CheckApi<Values, 'error'>;
  readonly validation: ValidationApi<Values, 'error'>;
  readonly status: StatusApi<Values>;
  readonly events: EventsApi<Values>;
  readonly submit: SubmitApi<Values, 'error'>;
};
type LeanParts = {
  readonly root: PartSpec<{}, {}, 'form'>;
  readonly field: PartSpec<{ readonly name: string }, {}, 'input'>;
  readonly fieldError: PartSpec<{ readonly name: string }, { readonly messages: readonly string[] }, 'p'>;
  readonly submit: PartSpec<{}, SubmitPartState, 'button'>;
};

const leanApi = <Values>(ctx: FormContext<LeanOptions<Values>, LeanState<Values>>): LeanApi<Values> => {
  const change = createChange<Values>(ctx);
  const values = createValues(ctx, { change });
  const validation = createValidation<Values, 'error'>(ctx, { values });
  const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
  const status = createFieldStatus(ctx, { values, validation });
  const events = createFieldEvents(ctx, { values, status, validation });
  const submit = createSubmit(ctx, { values, validation, status });

  return { values, error, validation, status, events, submit };
};

interface LeanKind extends FormKind {
  readonly options: LeanOptions<this['values']>;
  readonly state: LeanState<this['values']>;
  readonly api: LeanApi<this['values']>;
  readonly parts: LeanParts;
}

/** A form with only what a short embedded form needs: no arrays, no reset, no field handles. */
export const leanForm = defineForm<LeanKind>({
  name: 'lean',
  options: { id: 'id', schema: 'value', defaultValues: 'value', error: 'value', onSubmit: 'action' },
  api: ctx => leanApi(ctx),
  slots: slot => ({
    root: slot({
      element: 'form',
      on: {
        submit: (event, { api }) => {
          event.preventDefault();
          void api.submit.run();
        },
      },
    }),
    ...fieldSlots(slot),
    ...fieldErrorSlots(slot),
    ...submitSlots(slot),
  }),
});
