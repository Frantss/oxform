// `status`, `events`, `reset`, `arrays` and `handles`: their needs, and the check sugar that `handles` derives from the api.
import { arrays } from '../spike/src/arrays';
import { check } from '../spike/src/check';
import { events } from '../spike/src/events';
import { defineForm } from '../spike/src/form';
import { handles } from '../spike/src/handles';
import { reset } from '../spike/src/reset';
import { status } from '../spike/src/status';
import { schemaOf } from '../spike/src/test-helpers';
import { validation } from '../spike/src/validation';
import { values } from '../spike/src/values';

type V = { name: string; tags: string[] };
const base = defineForm({ schema: schemaOf<V>(), defaultValues: { name: '', tags: [] } });

// A lean form: no validation, so no check sugar.
const lean = base.extend(values).extend(status).extend(events).extend(reset).extend(arrays).extend(handles).create();
lean.field('name').change('x');
// @ts-expect-error no check in the chain, so no `error` on a field
lean.field('name').error;

// The sugar follows the checks that are in the chain before `handles`.
const checked = base
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true }))
  .extend(check('warning'))
  .extend(status)
  .extend(events)
  .extend(arrays)
  .extend(reset)
  .extend(handles)
  .create();
checked.field('name').error() satisfies readonly unknown[];
checked.field('name').warning() satisfies readonly unknown[];
checked.field('name').setError([{ message: 'x' }]);
checked.field('name').setWarning([{ message: 'x' }]);
// @ts-expect-error there is no `notice` check
checked.field('name').notice;
checked.scope('tags' as never);

// A check extended after `handles` has no sugar.
const late = base
  .extend(values)
  .extend(validation)
  .extend(check('error'))
  .extend(status)
  .extend(events)
  .extend(arrays)
  .extend(reset)
  .extend(handles)
  .extend(check('warning'))
  .create();
late.field('name').error();
// @ts-expect-error `warning` came after `handles`
late.field('name').warning;

// The derived status is typed as the public state, and `validation` is optional.
checked.store.state.status.fields.name!.valid satisfies boolean;
checked.store.state.status.form.dirty satisfies boolean;
lean.store.state.status.form.submitting satisfies boolean;

// Needs
// @ts-expect-error status needs values
base.extend(status);
// @ts-expect-error events needs status
base.extend(values).extend(events);
// @ts-expect-error reset needs status
base.extend(values).extend(reset);
// @ts-expect-error arrays needs status
base.extend(values).extend(arrays);
// @ts-expect-error handles needs events, reset and arrays
base.extend(values).extend(status).extend(handles);
