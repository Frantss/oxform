import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { configureForm, extendForm } from './form';
import { spikeForm } from './spike-form';

type Values = { email: string };

const schemaOf = (): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'spike', validate: value => ({ value: value as Values }) },
});

const rejecting: StandardSchemaV1<any> = {
  '~standard': { version: 1, vendor: 'spike', validate: () => ({ issues: [{ message: 'Required', path: ['email'] }] }) },
};

/** An extension that reaches the form only through the kernel's hooks. */
const hooked = (log: string[]) =>
  extendForm(spikeForm, {
    name: 'hooked',
    api: (_ctx, { values, validation }) => {
      values.intercept((change, details) => {
        if (change.value === 'blocked') details.cancel();
        else if (typeof change.value === 'string') return { ...change, value: change.value.trim() };
      });
      values.onChange(change => void log.push(`change:${change.path}=${String(change.value)}`));
      validation.onRun(run => void log.push(`run:${run.type}:${run.valid}`));
      return {};
    },
  });

const create = (log: string[], error?: StandardSchemaV1<any>) =>
  configureForm(hooked(log), {
    schema: schemaOf(),
    defaultValues: { email: '' },
    ...(error ? { error: { blur: error } } : {}),
  })();

describe('extension hooks', () => {
  it('rewrites a value change through values.intercept', () => {
    const log: string[] = [];
    const form = create(log);

    form.values.set('email', '  a  ');

    expect(form.values.get('email')).toBe('a');
  });

  it('refuses a value change through details.cancel()', () => {
    const log: string[] = [];
    const form = create(log);

    expect(form.values.set('email', 'blocked')).toBe(false);
    expect(form.values.get('email')).toBe('');
    expect(log).toEqual([]);
  });

  it('observes the written change through values.onChange', () => {
    const log: string[] = [];

    create(log).values.set('email', 'a');

    expect(log).toEqual(['change:email=a']);
  });

  it('observes a validation run through validation.onRun', async () => {
    const log: string[] = [];

    await create(log, rejecting).validation.run('email', { type: 'blur' });

    expect(log).toEqual(['run:blur:false']);
  });

  it('keeps the hooks of two instances apart', () => {
    const first: string[] = [];
    const second: string[] = [];
    const definition = hooked(first);
    const a = configureForm(definition, { schema: schemaOf(), defaultValues: { email: '' } })();
    configureForm(hooked(second), { schema: schemaOf(), defaultValues: { email: '' } })();

    a.values.set('email', 'x');

    expect(first).toEqual(['change:email=x']);
    expect(second).toEqual([]);
  });
});
