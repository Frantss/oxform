import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { CheckApi, CheckEntry, EventValidators, FormContext, FormKind, ValidationApi, ValuesApi } from '../../api';
import { createChange } from './change';
import { createCheck } from './check';
import { defineForm } from './form';
import { createValidation } from './validation';
import { createValues } from './values';

export type SpikeOptions<Values> = {
  readonly id?: string;
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
  readonly error?: EventValidators<Values>;
};
export type SpikeState<Values> = {
  readonly values: Values;
  readonly error: Readonly<Record<string, readonly CheckEntry[]>>;
};
export type SpikeApi<Values> = {
  readonly values: ValuesApi<Values>;
  readonly validation: ValidationApi<Values, 'error'>;
  readonly error: CheckApi<Values, 'error'>;
};
export interface SpikeKind extends FormKind {
  readonly options: SpikeOptions<this['values']>;
  readonly state: SpikeState<this['values']>;
  readonly api: SpikeApi<this['values']>;
  readonly parts: {};
}

/** Conformance (Plan step 4): written generic in `Values` and annotated with the kind's api, so drift fails to compile. */
export const spikeApi = <Values>(ctx: FormContext<SpikeOptions<Values>, SpikeState<Values>>): SpikeApi<Values> => {
  const values = createValues(ctx, { change: createChange<Values>(ctx) });
  const validation = createValidation<Values, 'error'>(ctx, { values });
  const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
  return { values, validation, error };
};

/** A drifted composition (here: no `error`) is rejected at generic `Values`. */
export const drifted = <Values>(ctx: FormContext<SpikeOptions<Values>, SpikeState<Values>>): SpikeApi<Values> => {
  const { error: _error, ...rest } = spikeApi(ctx);
  // @ts-expect-error missing `error`
  return rest;
};

export const spikeForm = defineForm<SpikeKind>({
  name: 'spike',
  options: { id: 'id', schema: 'value', defaultValues: 'value', error: 'value' },
  api: ctx => spikeApi(ctx),
});
