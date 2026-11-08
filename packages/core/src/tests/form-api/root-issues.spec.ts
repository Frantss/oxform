import { createForm } from '#form/create-form';
import type { FormIssuesByLevel, FormIssuesByLevelInput } from '#types/api/form-issue-entry';
import { expect, expectTypeOf, it, vi } from 'vite-plus/test';
import z from 'zod';

const setup = () =>
  createForm({
    schema: z.object({ name: z.string().min(1) }),
    defaultValues: { name: 'Ada' },
    checks: { warning: { blocking: false }, risk: { blocking: true } },
  });

it('keeps root writes separate from payload paths and aggregates fields only on request', () => {
  const form = setup();
  form.field.setIssues('name', { warning: [{ level: 'warning', issue: { message: 'Field warning' } }] });
  form.setIssues({ error: [{ level: 'error', issue: { message: 'Operation failed', path: ['name'] } }] });

  expect({
    root: form.issues(),
    field: form.field.issues('name'),
    nestedMessages: form.issues({ nested: true }).error.map(entry => entry.issue.message),
    nestedWarnings: form.issues({ nested: true }).warning.map(entry => entry.issue.message),
    stateMessages: form.state.issues.error.map(entry => entry.issue.message),
    value: form.state.values.name,
    valid: form.state.status.valid,
    fieldValid: form.field.status('name').valid,
  }).toEqual({
    root: { error: [{ level: 'error', issue: { message: 'Operation failed', path: ['name'] } }], warning: [], risk: [] },
    field: { error: [], warning: [{ level: 'warning', issue: { message: 'Field warning' } }], risk: [] },
    nestedMessages: ['Operation failed'],
    nestedWarnings: ['Field warning'],
    stateMessages: ['Operation failed'],
    value: 'Ada',
    valid: false,
    fieldValid: true,
  });
});

for (const { mode, errors, warnings } of [
  { mode: 'replace', errors: ['New failure'], warnings: [] },
  { mode: 'append', errors: ['Old failure', 'New failure'], warnings: ['Review'] },
  { mode: 'keep', errors: ['Old failure'], warnings: ['Review'] },
] as const) {
  it(`applies root issue ${mode} mode without changing field issues`, () => {
    const form = setup();
    form.field.setIssues('name', { error: [{ level: 'error', issue: { message: 'Field failure' } }] });
    form.setIssues(
      {
        error: [{ level: 'error', issue: { message: 'Old failure' } }],
        warning: [{ level: 'warning', issue: { message: 'Review' } }],
      },
      { mode: 'keep' },
    );
    form.setIssues({ error: [{ level: 'error', issue: { message: 'New failure' } }] }, { mode });

    expect({
      errors: form.issues().error.map(entry => entry.issue.message),
      warnings: form.issues().warning.map(entry => entry.issue.message),
      risk: form.state.issues.risk,
      field: form.field.issues('name').error.map(entry => entry.issue.message),
    }).toEqual({ errors, warnings, risk: [], field: ['Field failure'] });
  });
}

it('notifies root issue selectors when a message changes while validity stays false', () => {
  const form = setup();
  const observed: { message: string | undefined; valid: boolean }[] = [];
  const subscription = form.store.subscribe(() => {
    observed.push({ message: form.store.state.issues.error[0]?.issue.message, valid: form.status.valid });
  });
  try {
    form.setIssues({ error: [{ level: 'error', issue: { message: 'Failure A' } }] });
    form.setIssues({ error: [{ level: 'error', issue: { message: 'Failure B' } }] });
  } finally {
    subscription.unsubscribe();
  }

  expect(observed).toEqual([
    { message: 'Failure A', valid: false },
    { message: 'Failure B', valid: false },
  ]);
});

it('preserves root errors during targeted validation and clears operation errors on whole-form retry', async () => {
  const form = setup();
  form.setIssues({ error: [{ level: 'error', issue: { message: 'Previous operation failed' } }] });
  await form.validate('name');
  const afterTargeted = form.issues().error.map(entry => entry.issue.message);
  const onError = vi.fn<NonNullable<Parameters<typeof form.submit>[1]>>();
  await form.submit(() => {
    form.setIssues({ error: [{ level: 'error', issue: { message: 'Write rejected' } }] });
  }, onError)();
  const afterWrite = {
    messages: form.issues().error.map(entry => entry.issue.message),
    successful: form.status.successful,
    valid: form.status.valid,
  };
  let retryMessages: string[] | undefined;
  await form.submit(() => {
    retryMessages = form.state.issues.error.map(entry => entry.issue.message);
  }, onError)();

  expect({
    afterTargeted,
    afterWrite,
    retryMessages,
    errorCalls: onError.mock.calls.length,
    submits: form.status.submits,
    valid: form.status.valid,
  }).toEqual({
    afterTargeted: ['Previous operation failed'],
    afterWrite: { messages: ['Write rejected'], successful: true, valid: false },
    retryMessages: [],
    errorCalls: 0,
    submits: 2,
    valid: true,
  });
});

it('stores pathless validation failures at root and delivers them to submit onError', async () => {
  const form = createForm({
    schema: z.object({ name: z.string() }).refine(values => values.name === 'Ada', { message: 'Unknown account' }),
    defaultValues: { name: 'Grace' },
  });
  const onSuccess = vi.fn();
  const onError = vi.fn<NonNullable<Parameters<typeof form.submit>[1]>>();
  await form.submit(onSuccess, onError)();

  expect({
    rootMessages: form.state.issues.error.map(entry => entry.issue.message),
    fieldMessages: form.field.issues('name').error.map(entry => entry.issue.message),
    callbackMessages: onError.mock.calls[0]?.[0].error.map(entry => entry.issue.message),
    successCalls: onSuccess.mock.calls.length,
    valid: form.status.valid,
  }).toEqual({
    rootMessages: ['Unknown account'],
    fieldMessages: [],
    callbackMessages: ['Unknown account'],
    successCalls: 0,
    valid: false,
  });
});

it('blocks submit on persistent custom root levels while leaving nonblocking root levels visible', async () => {
  const form = setup();
  form.setIssues({
    warning: [{ level: 'warning', issue: { message: 'Review account' } }],
    risk: [{ level: 'risk', issue: { message: 'Approval required' } }],
  });
  const onSuccess = vi.fn();
  const onError = vi.fn<NonNullable<Parameters<typeof form.submit>[1]>>();
  await form.submit(onSuccess, onError)();
  const blocked = {
    successCalls: onSuccess.mock.calls.length,
    risk: form.issues().risk.map(entry => entry.issue.message),
    callbackRisk: onError.mock.calls[0]?.[0].risk.map(entry => entry.issue.message),
  };
  form.setIssues({ warning: [{ level: 'warning', issue: { message: 'Review account' } }] });
  await form.submit(onSuccess, onError)();

  expect({
    blocked,
    successCalls: onSuccess.mock.calls.length,
    errorCalls: onError.mock.calls.length,
    warning: form.state.issues.warning.map(entry => entry.issue.message),
    successful: form.status.successful,
    valid: form.status.valid,
  }).toEqual({
    blocked: { successCalls: 0, risk: ['Approval required'], callbackRisk: ['Approval required'] },
    successCalls: 1,
    errorCalls: 1,
    warning: ['Review account'],
    successful: true,
    valid: true,
  });
});

it('infers configured root issue levels across state readers and root setters', () => {
  const form = setup();
  type Levels = 'error' | 'warning' | 'risk';
  expectTypeOf(form.state.issues).toEqualTypeOf<FormIssuesByLevel<Levels>>();
  expectTypeOf(form.store.state.issues).toEqualTypeOf<FormIssuesByLevel<Levels>>();
  expectTypeOf(form.issues()).toEqualTypeOf<FormIssuesByLevel<Levels>>();
  expectTypeOf(form.setIssues).parameter(0).toEqualTypeOf<FormIssuesByLevelInput<Levels>>();
  expectTypeOf(form.state.values.name).toEqualTypeOf<string>();
});
