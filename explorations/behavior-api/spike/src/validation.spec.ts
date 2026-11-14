import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it, vi } from 'vitest';
import type { EventValidators } from '../../api';
import { createChange } from './change';
import { createCheck } from './check';
import { createContext } from './context';
import { createValidation } from './validation';
import { createValues } from './values';

type Values = { email: string; card: { number: string } };

/** A Standard Schema that reports the given messages at the given dot paths. */
const failing = (...issues: [path: string, message: string][]): StandardSchemaV1<any> => ({
  '~standard': {
    version: 1,
    vendor: 'spike',
    validate: () => ({ issues: issues.map(([path, message]) => ({ message, path: path ? path.split('.') : undefined })) }),
  },
});

const setup = (options: { error?: EventValidators<Values>; schema?: StandardSchemaV1<Values> } = {}) => {
  const defaultValues: Values = { email: '', card: { number: '' } };
  const [ctx] = createContext({ defaultValues, schema: failing(), ...options });
  const values = createValues<Values>(ctx, { change: createChange<Values>(ctx) });
  const validation = createValidation<Values, 'error'>(ctx, { values });
  const error = createCheck(ctx, { values, validation }, { name: 'error', blocking: true, exclusive: true });
  return { ctx, validation, error };
};

describe('createValidation with no check', () => {
  it('is valid and has no issues', async () => {
    const [ctx] = createContext({ defaultValues: { email: '' } });
    const values = createValues<{ email: string }>(ctx, { change: createChange(ctx) });
    const validation = createValidation(ctx, { values });

    expect(await validation.run()).toEqual([true, {}]);
  });
});

describe('error check', () => {
  it('groups issues by check name, adds the event type and blocks', async () => {
    const { validation, error } = setup({ error: { change: failing(['email', 'Required']) } });

    const [valid, issues] = await validation.run(undefined, { type: 'change' });

    expect(valid).toBe(false);
    expect(issues.error).toEqual([{ message: 'Required', path: ['email'], type: 'change' }]);
    expect(error.at('email')).toEqual(issues.error);
  });

  it('is valid when the validator reports nothing', async () => {
    const { validation } = setup({ error: { change: failing() } });

    expect(await validation.run(undefined, { type: 'change' })).toEqual([true, { error: [] }]);
  });

  it('leaves entries alone when no validator exists for the event', async () => {
    const { validation, error } = setup({ error: { change: failing(['email', 'Required']) } });
    error.set('email', [{ message: 'Manual' }]);

    await validation.run(undefined, { type: 'blur' });

    expect(error.at('email')).toEqual([{ message: 'Manual' }]);
  });

  it('replaces every entry in scope, including manual ones (exclusive)', async () => {
    const { validation, error } = setup({ error: { change: failing(['email', 'Required']) } });
    error.set('email', [{ message: 'Manual' }]);

    await validation.run('email', { type: 'change' });

    expect(error.at('email')).toEqual([{ message: 'Required', path: ['email'], type: 'change' }]);
  });

  it('keeps entries outside the run scope', async () => {
    const { validation, error } = setup({ error: { change: failing(['email', 'Required'], ['card.number', 'Bad']) } });
    error.set('card.number', [{ message: 'Manual' }]);

    await validation.run('email', { type: 'change' });

    expect(error.at('card.number')).toEqual([{ message: 'Manual' }]);
  });

  it('includes descendants of a target, and reads nested entries', async () => {
    const { validation, error } = setup({ error: { change: failing(['card.number', 'Bad']) } });

    await validation.run('card', { type: 'change' });

    expect(error.at('card')).toEqual([]);
    expect(error.at('card', { nested: true })).toHaveLength(1);
  });

  it('sets entries with replace, append and keep modes', () => {
    const { error } = setup();

    error.set('email', [{ message: 'a' }]);
    error.set('email', [{ message: 'b' }], { mode: 'append' });
    expect(error.at('email').map(entry => entry.message)).toEqual(['a', 'b']);

    error.set('email', [{ message: 'c' }], { mode: 'keep' });
    expect(error.at('email').map(entry => entry.message)).toEqual(['a', 'b']);

    error.set('email', []);
    expect(error.at('email')).toEqual([]);
  });

  it('passes the store to a validator function', async () => {
    const validator = vi.fn(() => failing());
    const { validation } = setup({ error: { change: validator } });

    await validation.run(undefined, { type: 'change' });

    expect(validator).toHaveBeenCalledWith(expect.objectContaining({ values: { email: '', card: { number: '' } } }));
  });

  it('reports every run to onRun', async () => {
    const { validation } = setup({ error: { change: failing(['email', 'Required']) } });
    const listener = vi.fn();
    validation.onRun(listener);

    await validation.run('email', { type: 'change' });

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ targets: ['email'], type: 'change', valid: false }));
  });
});
