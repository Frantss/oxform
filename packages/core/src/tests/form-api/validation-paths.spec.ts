import { createForm } from '#form/create-form';
import type { FormSubmitErrorHandler } from '#types/api/form-submit-error-handler';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { expect, it, vi } from 'vite-plus/test';

const defaultValues = {
  name: '',
  profile: { name: '' },
  guests: [{ name: '' }],
};

type Values = typeof defaultValues;

const setup = (issues: readonly StandardSchemaV1.Issue[]) => {
  const schema: StandardSchemaV1<Values> = {
    '~standard': {
      version: 1,
      vendor: 'issue-paths',
      validate: () => ({ issues }),
    },
  };

  return createForm({ schema, defaultValues });
};

it.each([
  { label: 'object segments', path: [{ key: 'name' }], field: 'name' },
  { label: 'nested object segments', path: [{ key: 'profile' }, { key: 'name' }], field: 'profile.name' },
  { label: 'mixed segments with a zero array index', path: ['guests', { key: 0 }, 'name'], field: 'guests.0.name' },
] as const)('stores validation errors and invalid status for $label', async ({ path, field }) => {
  const form = setup([{ message: 'Name is required', path }]);

  await form.validate();

  expect({
    messages: form.field.issues(field).error.map(entry => entry.issue.message),
    fieldValid: form.field.status(field).valid,
    formValid: form.status.valid,
  }).toEqual({
    messages: ['Name is required'],
    fieldValid: false,
    formValid: false,
  });
});

it('targets object-segment descendants without replacing sibling validation errors', async () => {
  const form = setup([
    { message: 'Profile name is required', path: [{ key: 'profile' }, { key: 'name' }] },
    { message: 'Guest name is required', path: [{ key: 'guests' }, { key: 0 }, { key: 'name' }] },
  ]);
  form.field.setIssues('name', { error: [{ level: 'error', issue: { message: 'Keep this error' } }] });

  const [valid, issues] = await form.validate('profile');

  expect({
    valid,
    returnedMessages: issues.error.map(entry => entry.issue.message),
    profileMessages: form.field.issues('profile.name').error.map(entry => entry.issue.message),
    siblingMessages: form.field.issues('name').error.map(entry => entry.issue.message),
    guestMessages: form.field.issues('guests.0.name').error.map(entry => entry.issue.message),
  }).toEqual({
    valid: false,
    returnedMessages: ['Profile name is required'],
    profileMessages: ['Profile name is required'],
    siblingMessages: ['Keep this error'],
    guestMessages: [],
  });
});

it('delivers object-segment validation errors to the rejected submit callback', async () => {
  const form = setup([{ message: 'Name is required', path: [{ key: 'name' }] }]);
  const onSuccess = vi.fn();
  const onError = vi.fn<FormSubmitErrorHandler<Values, 'error'>>();

  await form.submit(onSuccess, onError)();

  expect({
    accepted: onSuccess.mock.calls.length,
    rejectedMessages: onError.mock.calls[0]?.[0].error.map(entry => entry.issue.message),
    successful: form.status.successful,
  }).toEqual({
    accepted: 0,
    rejectedMessages: ['Name is required'],
    successful: false,
  });
});

it('stores asynchronous custom check issues using object-segment array paths', async () => {
  const schema: StandardSchemaV1<Values> = {
    '~standard': {
      version: 1,
      vendor: 'issue-paths',
      validate: async () => ({
        issues: [{ message: 'Review guest name', path: [{ key: 'guests' }, { key: 0 }, { key: 'name' }] }],
      }),
    },
  };
  const form = createForm({
    schema,
    defaultValues,
    checks: { warning: { validate: { change: schema } } },
  });

  const [valid] = await form.validate('guests.0.name', { type: 'change' });

  expect({
    valid,
    messages: form.field.issues('guests.0.name').warning.map(entry => entry.issue.message),
  }).toEqual({
    valid: true,
    messages: ['Review guest name'],
  });
});
