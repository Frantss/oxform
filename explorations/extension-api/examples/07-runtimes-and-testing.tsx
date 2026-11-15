// Type-checked: `tsc -p examples/tsconfig.json`. The types are in spike/src/api.ts and type-tests/.
//
// Use case: the same form in core, in tests, in React, and in Solid.
// Extensions run without a renderer, so each one is testable alone, on the leanest form that satisfies its needs.

import { defineForm, validation, values } from '@oxform/core';
import { standard } from '@oxform/core/standard';
import { createParts } from '@oxform/react';
import { expect, vi } from 'vitest';
import z from 'zod';
import { autosave } from './06-custom-behaviors';

const contactSchema = z.object({ email: z.email() });

const contact = defineForm({
  name: 'contact',
  schema: contactSchema,
  defaultValues: { email: '' },
})
  .extend(standard)
  .configure({ error: { submit: contactSchema } });

// Core only: scripts and tests.
{
  const form = contact.create();
  form.field('email').change('not-an-email');
  const [valid, issues] = await form.validation.run();
  // valid === false, issues.error[0].message is the schema's message
}

// One extension alone: a test form is a base and the extension. No preset, no DOM, no context object to build.
{
  const form = defineForm({ name: 'test', schema: contactSchema, defaultValues: { email: '' } })
    .extend(values)
    .create();

  form.values.intercept(change => ({ ...change, value: String(change.value).toLowerCase() }));
  form.values.set('email', 'ADA@EXAMPLE.COM');
  expect(form.values.get('email')).toBe('ada@example.com');
}

// An extension on the smallest form that meets its needs. `autosave` needs `values` and `validation`, so those two
// are enough. Nothing else is built, and a missing need is a type error at `.extend` before any test runs.
// Creation is inert, so a form that is only created starts no timer (see rule 6 of the readme).
{
  vi.useFakeTimers();
  const saved: unknown[] = [];
  const form = defineForm({ name: 'test', schema: contactSchema, defaultValues: { email: '' } })
    .extend(values)
    .extend(validation)
    .extend(autosave)
    .create({ saveDraft: draft => void saved.push(draft), autosaveDelay: 100 });

  form.values.set('email', 'ada@example.com');
  await vi.advanceTimersByTimeAsync(100);
  expect(saved).toEqual([{ email: 'ada@example.com' }]);
  expect(form.store.state.autosave.saving).toBe(false);
}

// React and Solid use the same call. Only the import changes, so one form serves every runtime.
{
  // import { createParts } from '@oxform/react' | '@oxform/solid' | '@oxform/solid/v2'
  const { Root, Field, Submit } = createParts(contact, { root: 'form', field: 'input', submit: 'button' });

  <Root onSubmit={values => save(values)}>
    <Field name='email' />
    <Submit>Send</Submit>
  </Root>;
}
