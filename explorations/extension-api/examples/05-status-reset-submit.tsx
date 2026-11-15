// Type-checked: `tsc -p examples/tsconfig.json`. The types are in spike/src/api.ts and type-tests/.
//
// Use case: interaction status, default-value comparison, submit lifecycle, and reset options.
// Each concern is one extension: `status`, `submit`, `reset`. Their options (`defaultStatus`, `onSubmit`, ...) are
// defaults set with `configure`, and `create(options)` or the props of `Root` override them.

import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/standard';
import { createParts } from '@oxform/react';
import z from 'zod';

const profile = defineForm({
  name: 'profile',
  schema: z.object({ name: z.string(), bio: z.string() }),
  defaultValues: { name: 'Ada', bio: '' },
})
  .extend(standard)
  .configure({ defaultStatus: { dirty: false, submits: 0 } });

// The submit lifecycle and reset as parts. Elements are chosen here, not in the definition:
//   root -> <form>, field -> <input>, submit -> <button type='submit'>, reset -> <button type='reset'>
const { Root, Field, Submit, Reset } = createParts(profile, {
  root: 'form',
  field: 'input',
  submit: 'button',
  reset: 'button',
});

export function ProfileForm() {
  return (
    <Root
      defaultFieldStatus={{ '*': { touched: false }, bio: { dirty: true } }} // path wins over '*'
      onSubmit={values => save(values)}
      onInvalid={issues => console.error(issues.error)}
    >
      <Field name='name' />
      <Field name='bio' />
      {/* Disabled while submitting. Children read the submit slot's state. */}
      <Submit>{({ submitting, submits }) => (submitting ? 'Saving' : `Save (${submits})`)}</Submit>
      <Reset>Reset</Reset>
    </Root>
  );
}

// The same lifecycle through the instance, without parts.
const form = profile.create({
  onSubmit: values => save(values),
  onInvalid: issues => console.error(issues.error),
});
const name = form.field('name');

// Field status: dirty, pristine, touched, blurred, valid, default.
// `default` is deep equality with the default value. `dirty` records interaction and does not clear itself.
name.change('Grace'); // marks dirty and touched, ancestors included, children not
name.change('Ada'); // default: true, dirty: still true
name.change('Grace', { should: { dirty: false, touch: false, validate: false } });
name.focus();
name.blur();
name.state.status;

// Form status: dirty, pristine, touched, blurred, valid, validating, submitting, submits, submitted, successful.
form.status.form;

// `submit`: sets dirty and submitting, validates (type 'submit'), awaits `onSubmit` or `onInvalid`,
// then increments submits and records `successful`. A rejected callback leaves completion status unchanged.
await form.submit.run();

// `reset`: defaults unless values are supplied. It never validates.
form.reset.all();
form.reset.all({ values: { name: 'Grace', bio: '' } }); // does not change defaults
form.reset.all({ status: { submits: 0 } });
form.reset.all({ keep: { checks: ['error'], refs: true } }); // `true` keeps every check
form.reset.all({ keep: { fields: true } }); // wins over the other flags

name.reset();
name.reset({ value: 'Linus' });
