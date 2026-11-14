// SKETCH: none of these APIs exist and this file is not compiled.
//
// Use case: the quick-start signup form with the suggested preset from `@oxform/core/standard`.
// Using the preset is optional. 06 and 03 show forms built on it, and 01 shows how it is made.

import { configureForm } from '@oxform/core';
import { standardForm } from '@oxform/core/standard';
import { createParts, usePart, type PartProps } from '@oxform/react';
import z from 'zod';

const schema = z.object({ name: z.string().min(3), email: z.email() });

// `standardForm` is a generic definition. `configureForm` fixes its options, which fixes Values and
// field names. The result is a configured definition, so parts can be typed from it.
export const signup = configureForm(standardForm, {
  schema,
  defaultValues: { name: '', email: '' },
  error: { change: schema },
});

// Like UI SDK, the definition names parts and the adapter picks each element:
//   root -> <form>, field -> <input>, fieldError -> <p>, submit -> <button>
// Parts render real elements. Props go to the element. Children may be a function of the part's state.
export const { Root, Field, FieldError, Submit, useForm, useField, useSelector } = createParts(signup, {
  root: 'form',
  field: 'input',
  fieldError: 'p',
  submit: 'button',
});

// `Root` takes the form's options as props, so `onSubmit` is the option, `(values) => ...`, and it shadows the
// <form>'s DOM `onSubmit`. A part passes every other prop to its element.
export function SignupForm() {
  return (
    <Root onSubmit={values => save(values)} onInvalid={issues => console.error(issues.error)}>
      <Field name='name' />
      <Field name='email' type='email' />
      {/* Not rendered while 'email' has no errors. */}
      <FieldError name='email'>{({ messages }) => messages[0]}</FieldError>
      <Submit>Submit</Submit>
    </Root>
  );
}

// A part with another element is written with `usePart`, as in UI SDK's custom parts.
// Here the same `field` slot renders a <select>.
export function PlanField(props: PartProps<'select'>) {
  return usePart(signup, 'field', { name: 'plan' }, props, 'select');
}

// Server data: options are props on Root. Changing them never resets values (replaces '~update').
export function EditProfile({ user }: { user: { name: string; email: string } }) {
  return <Root defaultValues={user} onSubmit={values => save(values)} />;
}

// Field state and instance access for code outside the parts. Styling can use the field's
// data-dirty, data-touched and data-blurred attributes instead.
function EmailHint() {
  const email = useField('email');
  return <small>{email.state.status.dirty ? 'edited' : 'untouched'}</small>;
}

function EmailFocus() {
  const form = useForm();
  const dirty = useSelector(state => state.status.form.dirty);
  return <button onClick={() => form.field('email').focus()}>{dirty ? 'Back to email' : 'Start with email'}</button>;
}

// Core-only use: `signup()` creates an instance, exactly like UI SDK's `rating({ id })`.
const form = signup();
form.field('email').change('ada@example.com');
