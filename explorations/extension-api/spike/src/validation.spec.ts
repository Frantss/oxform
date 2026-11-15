import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it, vi } from 'vitest';
import type { EventValidators } from './api';
import { check } from './check';
import { defineForm } from './form';
import { validation as validationExtension } from './validation';
import { values as valuesExtension } from './values';

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
  const { schema = failing(), error: validators } = options;
  const form = defineForm({ schema, defaultValues })
    .extend(valuesExtension)
    .extend(validationExtension)
    .extend(check('error', { blocking: true, exclusive: true }))
    .create({ error: validators });
  return { validation: form.validation, error: form.error };
};

describe('validation with no check', () => {
  it('is valid and has no issues', async () => {
    const { validation } = defineForm({ schema: failing(), defaultValues: { email: '' } })
      .extend(valuesExtension)
      .extend(validationExtension)
      .create();

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

describe('validation extensions, as types', () => {
  const base = () => defineForm({ schema: failing(), defaultValues: { email: '' } }).extend(valuesExtension);

  it('rejects an extension whose needs the form lacks', () => {
    // Types only: nothing here is called.
    const rejected = () => {
      // @ts-expect-error validation needs values
      defineForm({ schema: failing(), defaultValues: { email: '' } }).extend(validationExtension);
      // @ts-expect-error a check needs validation
      base().extend(check('error'));
    };
    expect(rejected).toBeTypeOf('function');
  });

  it('names the check from its argument, in the api and in the options', async () => {
    const form = base()
      .extend(validationExtension)
      .extend(check('hint'))
      .create({ hint: { change: failing(['email', 'Short']) } });

    const [valid, issues] = await form.validation.run(undefined, { type: 'change' });

    expect(valid).toBe(true);
    expect(form.hint.name).toBe('hint');
    expect(issues.hint.map(entry => entry.message)).toEqual(['Short']);
    // @ts-expect-error there is no `error` check on this form
    form.error;
  });

  it('throws when two checks share a name', () => {
    const checked = base().extend(validationExtension).extend(check('error'));

    expect(() => checked.extend(check('error'))).toThrow(/"check:error".*option "error".*"check:error"/);
  });
});
