import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import type { EventValidators } from './api';
import { check } from './check';
import { defineForm } from './form';
import { validation as validationExtension } from './validation';
import { values as valuesExtension } from './values';

type Values = { email: string };

const failing = (...messages: string[]): StandardSchemaV1<any> => ({
  '~standard': {
    version: 1,
    vendor: 'spike',
    validate: () => ({ issues: messages.map(message => ({ message, path: ['email'] })) }),
  },
});

const setup = (options: { error?: EventValidators<Values>; warning?: EventValidators<Values> }) => {
  const form = defineForm({ schema: failing() as StandardSchemaV1<Values>, defaultValues: { email: '' } })
    .extend(valuesExtension)
    .extend(validationExtension)
    .extend(check('error', { blocking: true, exclusive: true }))
    .extend(check('warning'))
    .create(options);
  return { validation: form.validation, error: form.error, warning: form.warning };
};

describe('warning check beside error', () => {
  it('registers with validation and groups issues by check name', async () => {
    const { validation } = setup({ error: { blur: failing('Required') }, warning: { blur: failing('Weak') } });

    const [, issues] = await validation.run(undefined, { type: 'blur' });

    expect(issues.error.map(entry => entry.message)).toEqual(['Required']);
    expect(issues.warning.map(entry => entry.message)).toEqual(['Weak']);
  });

  it('does not change valid (a non-blocking check)', async () => {
    const { validation } = setup({ warning: { blur: failing('Weak') } });

    const [valid, issues] = await validation.run(undefined, { type: 'blur' });

    expect(valid).toBe(true);
    expect(issues.warning).toHaveLength(1);
  });

  it('blocks through error while warning stays independent', async () => {
    const { validation } = setup({ error: { blur: failing('Required') } });

    const [valid, issues] = await validation.run(undefined, { type: 'blur' });

    expect(valid).toBe(false);
    expect(issues.warning).toEqual([]);
  });

  it('refreshes only entries of the selected event and keeps others and untyped ones', async () => {
    const { validation, warning } = setup({ warning: { blur: failing('Weak') } });
    warning.set('email', [{ message: 'Manual' }]);
    warning.set('email', [{ message: 'From change', type: 'change' }], { mode: 'append' });

    await validation.run('email', { type: 'blur' });

    expect(warning.at('email').map(entry => entry.message)).toEqual(['Manual', 'From change', 'Weak']);

    await validation.run('email', { type: 'blur' });

    expect(warning.at('email').map(entry => entry.message)).toEqual(['Manual', 'From change', 'Weak']);
  });

  it('does not let a warning run clear error entries, or the reverse', async () => {
    const { validation, error, warning } = setup({ warning: { blur: failing('Weak') } });
    error.set('email', [{ message: 'Manual error' }]);

    await validation.run('email', { type: 'blur' });

    expect(error.at('email').map(entry => entry.message)).toEqual(['Manual error']);
    expect(warning.at('email').map(entry => entry.message)).toEqual(['Weak']);
  });

  it('keeps the exclusive error check replacing manual entries in the same run', async () => {
    const { validation, error } = setup({ error: { blur: failing('Required') }, warning: { blur: failing('Weak') } });
    error.set('email', [{ message: 'Manual error' }]);

    await validation.run('email', { type: 'blur' });

    expect(error.at('email').map(entry => entry.message)).toEqual(['Required']);
  });
});
