import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  CheckApi,
  CheckState,
  EventValidators,
  EventsApi,
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
  readonly root: PartSpec;
  readonly field: PartSpec<{ readonly name: string }>;
  readonly fieldError: PartSpec<{ readonly name: string }, { readonly messages: readonly string[] }>;
  readonly submit: PartSpec<{}, SubmitPartState>;
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
  api: ctx => {
    const change = createChange(ctx);
    const values = createValues(ctx, { change });
    const validation = createValidation<any, 'error'>(ctx, { values });
    const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
    const status = createFieldStatus(ctx, { values, validation });
    const events = createFieldEvents(ctx, { values, status, validation });
    const submit = createSubmit(ctx, { values, validation, status });

    return { values, error, validation, status, events, submit } as LeanApi<any>;
  },
  slots: slot => ({
    root: slot({
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
