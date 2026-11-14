import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { EventValidators } from '../../../api';
import { createChange } from '../change';
import { createCheck } from '../check';
import { createFieldEvents } from '../events';
import { configureForm, defineForm } from '../form';
import { createFieldStatus } from '../status';
import { createSubmit } from '../submit';
import { createValidation } from '../validation';
import { createValues } from '../values';

type Login = { email: string; password: string };
type LoginOptions = {
  readonly schema: StandardSchemaV1<Login>;
  readonly defaultValues: Login;
  readonly error?: EventValidators<Login>;
  readonly onSubmit?: (values: Login) => unknown;
};

/** A lean login form: values, validation, one check, status, events and submit. No arrays, reset or handles. */
const loginForm = defineForm<any>({
  name: 'login',
  options: { schema: 'value', defaultValues: 'value', error: 'value', onSubmit: 'action' },
  api: (ctx: any) => {
    const values = createValues<Login>(ctx, { change: createChange(ctx) });
    const validation = createValidation<Login, 'error'>(ctx, { values });
    const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
    const status = createFieldStatus(ctx, { validation, values });
    const events = createFieldEvents(ctx, { values, status, validation });
    const submit = createSubmit(ctx, { values, validation, status });
    return { values, error, validation, status, events, submit };
  },
});

export const login = (options: LoginOptions) => (configureForm as any)(loginForm, options);
