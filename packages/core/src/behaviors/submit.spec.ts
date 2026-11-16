import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it, vi } from 'vite-plus/test';
import { defineForm } from '#main/form';
import { reporting, schemaOf, type TestIssue } from '../../tests/helpers';
import { check } from './check';
import { status, statusInternals } from './status';
import { submit } from './submit';
import { validation, type CheckValidators } from './validation';
import { values } from './values';

type Profile = { name: string; email: string };

const defaultValues: Profile = { name: '', email: '' };

/** A schema whose result waits until the test calls `release`. */
const deferred = (...issues: TestIssue[]) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => (release = resolve));
  const schema: StandardSchemaV1<never> = {
    '~standard': { version: 1, vendor: 'test', validate: async () => (await gate, { issues }) },
  };
  return { schema, release };
};

type Callbacks = {
  onSubmit?: (values: Profile, form: unknown, intent?: string) => unknown;
  onInvalid?: (issues: object, form: unknown, intent?: string) => unknown;
};

/**
 * `values`, `status` and `submit`, or with `validation`, a blocking `error` check and a `warning` check before them.
 * The callbacks default to spies.
 */
const setup = ({
  error,
  warning,
  checked = error !== undefined || warning !== undefined,
  ...callbacks
}: Callbacks & { error?: CheckValidators<Profile>; warning?: CheckValidators<Profile>; checked?: boolean } = {}) => {
  const onSubmit = vi.fn(callbacks.onSubmit);
  const onInvalid = vi.fn(callbacks.onInvalid);
  const base = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(values);
  const validated = base
    .extend(validation)
    .extend(check('error', { blocking: true }))
    .extend(check('warning'))
    .extend(status)
    .extend(submit);
  const plain = base.extend(status).extend(submit);
  const instance = checked ? validated.create({ error, warning, onSubmit, onInvalid }) : plain.create({ onSubmit, onInvalid });
  const full = instance as ReturnType<typeof validated.create>;

  return {
    form: plain,
    instance,
    onSubmit,
    onInvalid,
    validation: full.validation,
    error: full.error,
    warning: full.warning,
    [Symbol.dispose]: () => instance.destroy(),
  };
};

describe('submit as an extension', () => {
  it('throws at create without values, and names submit and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(submit as never);

    expect(() => lacking.create()).toThrow('The "submit" extension needs "values", which no earlier extension provides.');
  });

  it('throws at create without status, and names submit and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues })
      .extend(values)
      .extend(submit as never);

    expect(() => lacking.create()).toThrow('The "submit" extension needs "status", which no earlier extension provides.');
  });

  it('submits as valid on a chain without validation', async () => {
    using subject = setup();
    await subject.instance.submit.run();

    expect([subject.onSubmit.mock.calls.length, subject.instance.status.form.successful]).toEqual([1, true]);
  });
});

describe('submit.run', () => {
  it('sets submitting and form dirty before it validates', () => {
    using subject = setup();
    void subject.instance.submit.run();

    expect(subject.instance.status.form).toEqual(expect.objectContaining({ submitting: true, dirty: true }));
  });

  it('calls onSubmit with the values, the instance and the intent', async () => {
    using subject = setup({ checked: true });
    subject.instance.values.set('name', 'Ada');
    await subject.instance.submit.run('save');

    expect(subject.onSubmit).toHaveBeenCalledWith({ name: 'Ada', email: '' }, subject.instance, 'save');
  });

  it('records the result in the form status', async () => {
    using subject = setup({ checked: true });
    await subject.instance.submit.run();

    expect(subject.instance.status.form).toEqual(expect.objectContaining({ submitting: false, submits: 1, submitted: true, successful: true }));
  });

  it('calls onInvalid with every current issue, the instance and the intent', async () => {
    using subject = setup({ error: { submit: reporting({ message: 'Required', path: ['email'] }) } });
    subject.warning.set('name', [{ message: 'Weak' }]);
    await subject.instance.submit.run('publish');

    expect([subject.onInvalid.mock.calls[0], subject.instance.status.form.successful]).toEqual([
      [{ error: [{ message: 'Required', path: ['email'], type: 'submit' }], warning: [{ message: 'Weak' }] }, subject.instance, 'publish'],
      false,
    ]);
  });

  it('fails a valid run when a blocking issue is kept from before', async () => {
    using subject = setup({ checked: true });
    subject.error.set('name', [{ message: 'Server' }]);
    await subject.instance.submit.run();

    expect([subject.onSubmit.mock.calls.length, subject.onInvalid.mock.calls.length]).toEqual([0, 1]);
  });

  it('submits with an issue of a check that does not block', async () => {
    using subject = setup({ warning: { submit: reporting({ message: 'Weak', path: ['name'] }) } });
    await subject.instance.submit.run();

    expect(subject.onSubmit).toHaveBeenCalledOnce();
  });
});

describe('concurrent submits', () => {
  it('share one attempt, and drop the intent of the later call', async () => {
    using subject = setup();
    const first = subject.instance.submit.run('first');
    const second = subject.instance.submit.run('second');
    await Promise.all([first, second]);

    expect([first === second, subject.onSubmit.mock.calls.map(call => call[2])]).toEqual([true, ['first']]);
  });

  it('start a new attempt after the first one settles', async () => {
    using subject = setup();
    await subject.instance.submit.run();
    await subject.instance.submit.run();

    expect([subject.onSubmit.mock.calls.length, subject.instance.status.form.submits]).toEqual([2, 2]);
  });
});

describe('aborted submits', () => {
  it('call no callback when a value changes during validation, and still settle', async () => {
    const gate = deferred();
    using subject = setup({ error: { submit: gate.schema } });
    const pending = subject.instance.submit.run();
    await Promise.resolve();
    subject.instance.values.set('name', 'late');
    gate.release();
    await pending;

    expect([subject.onSubmit.mock.calls.length, subject.onInvalid.mock.calls.length, subject.instance.status.form]).toEqual([
      0,
      0,
      expect.objectContaining({ submitting: false, submits: 1, successful: null }),
    ]);
  });

  it('call no callback when a newer validation run supersedes the one of submit', async () => {
    const gate = deferred();
    using subject = setup({ error: { submit: gate.schema } });
    const pending = subject.instance.submit.run();
    await Promise.resolve();
    const newer = subject.validation.run(undefined, { type: 'submit' });
    gate.release();
    await Promise.all([pending, newer]);

    expect([subject.onSubmit.mock.calls.length, subject.onInvalid.mock.calls.length]).toEqual([0, 0]);
  });

  it('call no callback after a reset, and leave the reset status as it is', async () => {
    const gate = deferred();
    using subject = setup({ error: { submit: gate.schema } });
    const pending = subject.instance.submit.run();
    await Promise.resolve();
    statusInternals(subject.instance.status).reset();
    gate.release();
    await pending;

    expect([subject.onSubmit.mock.calls.length, subject.instance.status.form]).toEqual([
      0,
      expect.objectContaining({ submitting: false, submits: 0 }),
    ]);
  });
});

describe('rejected submits', () => {
  it('reject when onSubmit throws, and record an unsuccessful submit', async () => {
    using subject = setup({
      onSubmit: () => {
        throw new Error('network');
      },
    });
    const error = await subject.instance.submit.run().catch((reason: Error) => reason.message);

    expect([error, subject.instance.status.form]).toEqual(['network', expect.objectContaining({ submitting: false, successful: false })]);
  });

  it('reject when the validation rejects, and record an unsuccessful submit', async () => {
    const failing: StandardSchemaV1<never> = {
      '~standard': { version: 1, vendor: 'test', validate: () => Promise.reject(new Error('boom')) },
    };
    using subject = setup({ error: { submit: failing } });
    const error = await subject.instance.submit.run().catch((reason: Error) => reason.message);

    expect([error, subject.instance.status.form.successful]).toEqual(['boom', false]);
  });
});

describe('intercept and onResult', () => {
  it('run the interceptors before validation, sync and async, with the values', async () => {
    using subject = setup();
    const seen: unknown[] = [];
    subject.instance.submit.intercept(attempt => void seen.push(attempt.values));
    subject.instance.submit.intercept(async attempt => void seen.push(await Promise.resolve(attempt.canceled)));
    await subject.instance.submit.run();

    expect(seen).toEqual([defaultValues, false]);
  });

  it('stop the submit when an interceptor cancels it, and skip the later interceptors', async () => {
    using subject = setup();
    const later = vi.fn();
    subject.instance.submit.intercept(attempt => attempt.cancel());
    subject.instance.submit.intercept(later);
    await subject.instance.submit.run();

    expect([subject.onSubmit.mock.calls.length, later.mock.calls.length, subject.instance.status.form]).toEqual([
      0,
      0,
      expect.objectContaining({ submitting: false, submits: 0 }),
    ]);
  });

  it('report the result of each submit that reached a callback', async () => {
    using subject = setup({ error: { submit: reporting({ message: 'Required', path: ['email'] }) } });
    const listener = vi.fn();
    subject.instance.submit.onResult(listener);
    await subject.instance.submit.run();

    expect(listener).toHaveBeenCalledWith({
      successful: false,
      issues: { error: [{ message: 'Required', path: ['email'], type: 'submit' }], warning: [] },
    });
  });

  it('stop calling an interceptor and a listener after they unsubscribe', async () => {
    using subject = setup();
    const interceptor = vi.fn();
    const listener = vi.fn();
    subject.instance.submit.intercept(interceptor)();
    subject.instance.submit.onResult(listener)();
    await subject.instance.submit.run();

    expect([interceptor.mock.calls.length, listener.mock.calls.length]).toEqual([0, 0]);
  });
});
