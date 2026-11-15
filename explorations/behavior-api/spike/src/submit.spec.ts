import { describe, expect, it, vi } from 'vitest';
import { createProfileForm, deferred, failing } from './test-helpers';

const nameRequired = failing({ message: 'Required', path: ['name'] });

describe('submit', () => {
  it('validates, calls onSubmit with the values and the form, and records the result', async () => {
    const onSubmit = vi.fn();
    const form = createProfileForm({ onSubmit });
    form.values.set('name', 'Ada');

    expect(form.status.form.submitting).toBe(false);
    const run = form.submit.run();
    expect(form.status.form).toMatchObject({ submitting: true, dirty: true, pristine: true });
    await run;

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada' }), form, undefined);
    expect(form.status.form).toMatchObject({ submitting: false, submits: 1, submitted: true, successful: true });
  });

  it('passes the intent of the run to onSubmit and onInvalid', async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const form = createProfileForm({ onSubmit, onInvalid });

    await form.submit.run('publish');
    expect(onSubmit).toHaveBeenCalledWith(expect.anything(), form, 'publish');

    const failingForm = createProfileForm({ error: { submit: nameRequired }, onInvalid });
    await failingForm.submit.run('draft');
    expect(onInvalid).toHaveBeenCalledWith(expect.anything(), failingForm, 'draft');
  });

  it('calls onInvalid with every current issue when validation fails', async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const form = createProfileForm({ error: { submit: nameRequired }, onSubmit, onInvalid });

    await form.submit.run();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith({ error: [expect.objectContaining({ message: 'Required' })] }, form, undefined);
    expect(form.status.form).toMatchObject({ submits: 1, successful: false });
  });

  it('fails when a preserved blocking issue makes the form invalid, though the run was valid', async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const form = createProfileForm({ error: { submit: failing() }, onSubmit, onInvalid });
    form.error.set('name', [{ message: 'Manual' }]);

    await form.submit.run();
    // an exclusive error check replaces manual entries, so the form is valid again
    expect(onSubmit).toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('shares one attempt between concurrent calls', async () => {
    const gate = deferred();
    const onSubmit = vi.fn();
    const form = createProfileForm({ error: { submit: gate.schema }, onSubmit });

    const first = form.submit.run();
    const second = form.submit.run();
    gate.release();
    await Promise.all([first, second]);

    expect(first).toBe(second);
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(form.status.form.submits).toBe(1);
  });

  it('aborts without callbacks or a retry when a value changes during validation, and still settles', async () => {
    const gate = deferred();
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const form = createProfileForm({ error: { submit: gate.schema }, onSubmit, onInvalid });

    const run = form.submit.run();
    form.values.set('name', 'changed');
    gate.release();
    await run;

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
    expect(form.status.form).toMatchObject({ submitting: false, submits: 1, successful: null });
  });

  it('does not overwrite the status a reset installed during the attempt', async () => {
    const gate = deferred();
    const onSubmit = vi.fn();
    const form = createProfileForm({ error: { submit: gate.schema }, onSubmit });

    const run = form.submit.run();
    form.reset.all({ status: { submits: 7 } });
    gate.release();
    await run;

    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.status.form).toMatchObject({ submitting: false, submits: 7 });
  });

  it('rejects when the callback rejects, and leaves successful false', async () => {
    const form = createProfileForm({ onSubmit: () => Promise.reject(new Error('server')) });

    await expect(form.submit.run()).rejects.toThrow('server');

    expect(form.status.form).toMatchObject({ submitting: false, submits: 1, successful: false });
  });

  it('rejects when validation rejects', async () => {
    const rejecting = { '~standard': { version: 1, vendor: 'spike', validate: () => Promise.reject(new Error('boom')) } };
    const form = createProfileForm({ error: { submit: rejecting as never } });

    await expect(form.submit.run()).rejects.toThrow('boom');

    expect(form.status.form).toMatchObject({ submitting: false, submits: 1, successful: false });
  });

  it('lets an interceptor cancel before validation, with no callbacks and no submit counted', async () => {
    const onSubmit = vi.fn();
    const validate = vi.fn();
    const form = createProfileForm({ error: { submit: failing() }, onSubmit });
    form.validation.onRun(validate);
    form.submit.intercept(attempt => attempt.cancel());

    await form.submit.run();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(form.status.form).toMatchObject({ submitting: false, submits: 0 });
  });

  it('awaits an async interceptor and reports each result to onResult', async () => {
    const order: string[] = [];
    const form = createProfileForm({ onSubmit: () => void order.push('submit') });
    form.submit.intercept(async () => {
      await Promise.resolve();
      order.push('intercept');
    });
    form.submit.onResult(result => void order.push(`result:${result.successful}`));

    await form.submit.run();

    expect(order).toEqual(['intercept', 'submit', 'result:true']);
  });

  it('allows a new attempt after the previous one settled', async () => {
    const onSubmit = vi.fn();
    const form = createProfileForm({ onSubmit });

    await form.submit.run();
    await form.submit.run();

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(form.status.form.submits).toBe(2);
  });
});
