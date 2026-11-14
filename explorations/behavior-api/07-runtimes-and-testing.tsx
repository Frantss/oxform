// SKETCH: none of these APIs exist and this file is not compiled.
//
// Use case: the same definition in core, in tests, in React, and in Solid.
// Behaviors run without a renderer, so each one is testable alone.

import { configureForm, createChange, createContext, createValues } from '@oxform/core';
import { standardForm } from '@oxform/core/standard';
import z from 'zod';

const contact = configureForm(standardForm, {
  schema: z.object({ email: z.email() }),
  defaultValues: { email: '' },
  error: { submit: z.object({ email: z.email() }) },
});

// Core only: scripts and tests.
{
  const form = contact();
  form.field('email').change('not-an-email');
  const [valid, issues] = await form.validation.run();
  // valid === false, issues.error[0].message is the schema's message
}

// One behavior alone: a test context is a store plus options. No form, no DOM.
{
  const ctx = createContext({ defaultValues: { email: '' } });
  const values = createValues(ctx, { change: createChange(ctx) });

  values.intercept(change => ({ ...change, value: String(change.value).toLowerCase() }));
  values.set('email', 'ADA@EXAMPLE.COM');
  expect(values.get('email')).toBe('ada@example.com');
}

// React and Solid use the same call. Only the import changes, so one definition serves every runtime.
{
  // import { createParts } from '@oxform/react' | '@oxform/solid' | '@oxform/solid/v2'
  const { Root, Field, Submit } = createParts(contact, { root: 'form', field: 'input', submit: 'button' });

  <Root onSubmit={values => save(values)}>
    <Field name='email' />
    <Submit>Send</Submit>
  </Root>;
}
