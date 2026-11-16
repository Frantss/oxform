import { describe, expect, it, vi } from 'vite-plus/test';
import { defineForm } from '#core';
import { check } from '#core/behaviors';
import { standard } from '#core/presets';
import { deferred, schemaOf, settled } from './helpers';

type Login = { email: string; password: string };

const issue = { message: 'Late', path: ['email'] };

/**
 * A standard form whose `error` check waits on a gate for blur and submit, and a `warning` check after it. With
 * `twoChecks`, the warning check waits on a second gate for blur.
 */
const setup = ({ twoChecks = false } = {}) => {
  const gate = deferred(issue);
  const warning = deferred({ message: 'Weak', path: ['email'] });
  const onSubmit = vi.fn();
  const onInvalid = vi.fn();
  const instance = defineForm({ schema: schemaOf<Login>(), defaultValues: { email: '', password: '' } })
    .extend(standard)
    .extend(check('warning'))
    .create({ error: { blur: gate.schema, submit: gate.schema }, warning: twoChecks ? { blur: warning.schema } : {}, onSubmit, onInvalid });

  return { instance, gate, warning, onSubmit, onInvalid, [Symbol.dispose]: () => instance.destroy() };
};

describe('validation lanes and races', () => {
  it('drop a run when its value changes during the run', async () => {
    using subject = setup();
    const run = subject.instance.validation.run('email', { type: 'blur' });
    subject.instance.values.set('email', 'ada@example.com');
    subject.gate.release();
    await run;

    expect(subject.instance.error.at('email')).toEqual([]);
  });

  it('keep the newer of two runs of one lane', async () => {
    using subject = setup();
    const older = subject.instance.validation.run('email', { type: 'blur' });
    const newer = subject.instance.validation.run('email', { type: 'blur' });
    subject.gate.release();
    const results = await Promise.all([older, newer]);

    expect(results.map(([valid]) => valid)).toEqual([true, false]);
  });

  it('drop a run when the form resets during the run', async () => {
    using subject = setup();
    const run = subject.instance.validation.run('email', { type: 'blur' });
    subject.instance.reset.all();
    subject.gate.release();
    await run;

    expect([subject.instance.error.at('email'), subject.instance.status.form.validating]).toEqual([[], false]);
  });

  it('abort a submit when a value changes during its validation', async () => {
    using subject = setup();
    const submitting = subject.instance.submit.run();
    await settled();
    subject.instance.field('email').change('ada@example.com');
    subject.gate.release();
    await submitting;

    expect([subject.onSubmit.mock.calls.length, subject.onInvalid.mock.calls.length, subject.instance.status.form.submitting]).toEqual([0, 0, false]);
  });

  it('abort a submit when the form resets during its validation, and keep the reset status', async () => {
    using subject = setup();
    const submitting = subject.instance.submit.run();
    await settled();
    subject.instance.reset.all();
    subject.gate.release();
    await submitting;

    expect([subject.onInvalid.mock.calls.length, subject.instance.status.form]).toEqual([
      0,
      expect.objectContaining({ submitting: false, submits: 0, successful: null }),
    ]);
  });

  it('stay validating while runs of two checks are pending, until the last one settles', async () => {
    using subject = setup({ twoChecks: true });
    subject.instance.field('email').blur();
    await settled();
    subject.gate.release();
    await settled();
    const oneLeft = subject.instance.status.form.validating;
    subject.warning.release();
    await settled();

    expect([oneLeft, subject.instance.status.form.validating, subject.instance.warning.at('email').length]).toEqual([true, false, 1]);
  });
});
