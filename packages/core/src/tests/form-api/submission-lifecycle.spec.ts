import { FormApi } from '#form/form-api';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(resolver => {
    resolve = resolver;
  });
  return { promise, resolve };
};

it('clears rejected submit callbacks and permits a completed retry', async () => {
  const form = new FormApi({
    schema: z.object({ name: z.string() }),
    defaultValues: { name: 'Ada' },
  });
  const failure = new Error('Write failed');
  const onSuccess = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue(undefined);
  const submit = form.submit(onSuccess);

  const rejected = await submit().catch(error => error);
  const afterRejection = {
    submitting: form.status.submitting,
    submits: form.status.submits,
    successful: form.status.successful,
  };
  await submit();

  expect({
    rejected,
    afterRejection,
    calls: onSuccess.mock.calls.length,
    afterRetry: {
      submitting: form.status.submitting,
      submits: form.status.submits,
      successful: form.status.successful,
    },
  }).toEqual({
    rejected: failure,
    afterRejection: { submitting: false, submits: 1, successful: false },
    calls: 2,
    afterRetry: { submitting: false, submits: 2, successful: true },
  });
});

it('coalesces distinct submit handlers until their shared callback settles', async () => {
  const entered = deferred();
  const gate = deferred();
  const form = new FormApi({
    schema: z.object({ name: z.string() }),
    defaultValues: { name: 'Ada' },
  });
  const onSuccess = vi.fn(async () => {
    entered.resolve();
    await gate.promise;
  });
  const otherSuccess = vi.fn();
  const first = form.submit(onSuccess)();
  const synchronousBusy = form.status.submitting;
  const second = form.submit(otherSuccess)();
  let secondSettled = false;
  void second.then(() => {
    secondSettled = true;
  });
  await entered.promise;
  await Promise.resolve();
  const whilePending = {
    submitting: form.status.submitting,
    submits: form.status.submits,
    secondSettled,
  };
  gate.resolve();
  await Promise.all([first, second]);

  expect({
    synchronousBusy,
    whilePending,
    firstCalls: onSuccess.mock.calls.length,
    otherCalls: otherSuccess.mock.calls.length,
    completed: { submitting: form.status.submitting, submits: form.status.submits },
  }).toEqual({
    synchronousBusy: true,
    whilePending: { submitting: true, submits: 0, secondSettled: false },
    firstCalls: 1,
    otherCalls: 0,
    completed: { submitting: false, submits: 1 },
  });
});

it('shares validator rejection across overlapping submits and allows validation retry', async () => {
  const gate = deferred();
  const failure = new Error('Validator failed');
  let shouldReject = true;
  const defaultValues = { name: 'Ada' };
  const schema: StandardSchemaV1<typeof defaultValues> = {
    '~standard': {
      version: 1,
      vendor: 'submission-lifecycle',
      validate: async value => {
        await gate.promise;
        if (shouldReject) throw failure;
        return { value: value as typeof defaultValues };
      },
    },
  };
  const form = new FormApi({ schema, defaultValues });
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const submit = form.submit(onSuccess, onError);
  const first = submit().catch(error => error);
  const second = form
    .submit(onSuccess, onError)()
    .catch(error => error);
  gate.resolve();
  const rejections = await Promise.all([first, second]);
  const afterRejection = {
    submitting: form.status.submitting,
    validating: form.status.validating,
    submits: form.status.submits,
    successful: form.status.successful,
    successCalls: onSuccess.mock.calls.length,
    errorCalls: onError.mock.calls.length,
  };
  shouldReject = false;
  await submit();

  expect({
    rejections,
    afterRejection,
    afterRetry: { submits: form.status.submits, successCalls: onSuccess.mock.calls.length },
  }).toEqual({
    rejections: [failure, failure],
    afterRejection: {
      submitting: false,
      validating: false,
      submits: 1,
      successful: false,
      successCalls: 0,
      errorCalls: 0,
    },
    afterRetry: { submits: 2, successCalls: 1 },
  });
});

it('settles a rejected validation-error callback without swallowing the rejection', async () => {
  const form = new FormApi({
    schema: z.object({ name: z.string().min(1) }),
    defaultValues: { name: '' },
  });
  const failure = new Error('Error callback failed');
  const rejected = await form
    .submit(vi.fn(), async () => {
      throw failure;
    })()
    .catch(error => error);

  expect({
    rejected,
    submitting: form.status.submitting,
    submits: form.status.submits,
    successful: form.status.successful,
  }).toEqual({ rejected: failure, submitting: false, submits: 1, successful: false });
});

it('aborts submit callbacks when values change during asynchronous validation', async () => {
  const gate = deferred();
  const form = new FormApi({
    schema: z.object({
      name: z
        .string()
        .min(1)
        .superRefine(async () => {
          await gate.promise;
        }),
    }),
    defaultValues: { name: 'Ada' },
  });
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const submission = form.submit(onSuccess, onError)();
  form.field.change('name', '', { should: { validate: false } });
  gate.resolve();
  await submission;

  expect({
    successCalls: onSuccess.mock.calls.length,
    errorCalls: onError.mock.calls.length,
    value: form.values.name,
    submits: form.status.submits,
    submitting: form.status.submitting,
    successful: form.status.successful,
  }).toEqual({
    successCalls: 0,
    errorCalls: 0,
    value: '',
    submits: 1,
    submitting: false,
    successful: false,
  });
});

it('aborts a superseded submit validation without inventing validation-error callbacks', async () => {
  const gate = deferred();
  const form = new FormApi({
    schema: z.object({
      name: z.string().superRefine(async () => {
        await gate.promise;
      }),
    }),
    defaultValues: { name: 'Ada' },
  });
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const submission = form.submit(onSuccess, onError)();
  const newerValidation = form.validate(undefined, { type: 'submit' });
  gate.resolve();
  await Promise.all([submission, newerValidation]);

  expect({
    successCalls: onSuccess.mock.calls.length,
    errorCalls: onError.mock.calls.length,
    submits: form.status.submits,
    successful: form.status.successful,
    submitting: form.status.submitting,
  }).toEqual({ successCalls: 0, errorCalls: 0, submits: 1, successful: false, submitting: false });
});

it('preserves reset status when an invalidated submit validation finishes', async () => {
  const gate = deferred();
  const form = new FormApi({
    schema: z.object({
      name: z.string().superRefine(async () => {
        await gate.promise;
      }),
    }),
    defaultValues: { name: 'Ada' },
  });
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const submission = form.submit(onSuccess, onError)();
  form.reset({ status: { submits: 7, successful: true } });
  gate.resolve();
  await submission;

  expect({
    successCalls: onSuccess.mock.calls.length,
    errorCalls: onError.mock.calls.length,
    submits: form.status.submits,
    successful: form.status.successful,
    submitting: form.status.submitting,
    dirty: form.status.dirty,
  }).toEqual({
    successCalls: 0,
    errorCalls: 0,
    submits: 7,
    successful: true,
    submitting: false,
    dirty: false,
  });
});

it('does not overwrite reset status after an already-started submit callback settles', async () => {
  const entered = deferred();
  const gate = deferred();
  const form = new FormApi({
    schema: z.object({ name: z.string() }),
    defaultValues: { name: 'Ada' },
  });
  const submission = form.submit(async () => {
    entered.resolve();
    await gate.promise;
  })();
  await entered.promise;
  form.reset();
  gate.resolve();
  await submission;

  expect({
    submits: form.status.submits,
    successful: form.status.successful,
    submitting: form.status.submitting,
  }).toEqual({ submits: 0, successful: false, submitting: false });
});

it('coalesces submit calls made synchronously by busy-state observers', async () => {
  const form = new FormApi({
    schema: z.object({ name: z.string() }),
    defaultValues: { name: 'Ada' },
  });
  const onSuccess = vi.fn();
  const otherSuccess = vi.fn();
  let reentrant: Promise<void> | undefined;
  const subscription = form.store.subscribe(() => {
    if (form.status.submitting && !reentrant) reentrant = form.submit(otherSuccess)();
  });
  try {
    await form.submit(onSuccess)();
    await reentrant;
  } finally {
    subscription.unsubscribe();
  }

  expect({
    firstCalls: onSuccess.mock.calls.length,
    reentrantCalls: otherSuccess.mock.calls.length,
    submits: form.status.submits,
  }).toEqual({ firstCalls: 1, reentrantCalls: 0, submits: 1 });
});

it('aborts submit validation when a field reset restores different values', async () => {
  const gate = deferred();
  const form = new FormApi({
    schema: z.object({
      name: z
        .string()
        .min(1)
        .superRefine(async () => {
          await gate.promise;
        }),
    }),
    defaultValues: { name: '' },
  });
  form.field.change('name', 'Ada', { should: { validate: false } });
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const submission = form.submit(onSuccess, onError)();
  form.field.reset('name');
  gate.resolve();
  await submission;

  expect({
    successCalls: onSuccess.mock.calls.length,
    errorCalls: onError.mock.calls.length,
    value: form.values.name,
    submits: form.status.submits,
    successful: form.status.successful,
    submitting: form.status.submitting,
  }).toEqual({
    successCalls: 0,
    errorCalls: 0,
    value: '',
    submits: 1,
    successful: false,
    submitting: false,
  });
});

it('allows idle-state observers to start a retry without losing its new in-flight attempt', async () => {
  const gate = deferred();
  const form = new FormApi({
    schema: z.object({ name: z.string() }),
    defaultValues: { name: 'Ada' },
  });
  const onRetry = vi.fn(async () => {
    await gate.promise;
  });
  const onJoined = vi.fn();
  let retryRequested = false;
  let retry: Promise<void> | undefined;
  const subscription = form.store.subscribe(() => {
    if (!form.status.submitting && form.status.submits === 1 && !retryRequested) {
      retryRequested = true;
      retry = form.submit(onRetry)();
    }
  });
  let retryBusy: boolean;
  try {
    await form.submit(vi.fn())();
    const joined = form.submit(onJoined)();
    retryBusy = form.status.submitting;
    gate.resolve();
    await Promise.all([retry, joined]);
  } finally {
    gate.resolve();
    subscription.unsubscribe();
  }

  expect({
    retryRequested,
    retryBusy,
    retryCalls: onRetry.mock.calls.length,
    joinedCalls: onJoined.mock.calls.length,
    submits: form.status.submits,
    submitting: form.status.submitting,
  }).toEqual({
    retryRequested: true,
    retryBusy: true,
    retryCalls: 1,
    joinedCalls: 0,
    submits: 2,
    submitting: false,
  });
});
