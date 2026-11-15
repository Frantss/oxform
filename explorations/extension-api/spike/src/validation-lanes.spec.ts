import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it, vi } from 'vitest';
import type { EventValidators } from './api';
import { check } from './check';
import { defineForm } from './form';
import { validation as validationExtension } from './validation';
import { values as valuesExtension } from './values';

type Values = { email: string; name: string; tags: string[] };

type Issue = { message: string; path?: (PropertyKey | { key: PropertyKey })[] };

const schemaWith = (issues: Issue[]): StandardSchemaV1<any> => ({
  '~standard': { version: 1, vendor: 'spike', validate: () => ({ issues }) },
});

/** A schema whose result is released by the test. */
const deferred = (issues: Issue[]) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => (release = resolve));
  const schema: StandardSchemaV1<any> = {
    '~standard': { version: 1, vendor: 'spike', validate: async () => (await gate, { issues }) },
  };
  return { schema, release };
};

const setup = (options: { error?: EventValidators<Values>; warning?: EventValidators<Values> }) => {
  const form = defineForm({
    schema: schemaWith([]) as StandardSchemaV1<Values>,
    defaultValues: { email: '', name: '', tags: [] } as Values,
  })
    .extend(valuesExtension)
    .extend(validationExtension)
    .extend(check('error', { blocking: true, exclusive: true }))
    .extend(check('warning'))
    .create(options);
  return { values: form.values, validation: form.validation, error: form.error, warning: form.warning };
};

const required: Issue = { message: 'Required', path: ['email'] };

describe('stale results', () => {
  it('discards a run when an overlapping value changes, and returns [true, {}]', async () => {
    const gate = deferred([required]);
    const { values, validation, error } = setup({ error: { blur: gate.schema } });

    const pending = validation.run('email', { type: 'blur' });
    values.set('email', 'a');
    gate.release();

    expect(await pending).toEqual([true, {}]);
    expect(error.at('email')).toEqual([]);
  });

  it('discards a whole-form run for any value change', async () => {
    const gate = deferred([required]);
    const { values, validation, error } = setup({ error: { blur: gate.schema } });

    const pending = validation.run(undefined, { type: 'blur' });
    values.set('name', 'a');
    gate.release();

    expect(await pending).toEqual([true, {}]);
    expect(error.at('email')).toEqual([]);
  });

  it('keeps a targeted run when an unrelated value changes', async () => {
    const gate = deferred([required]);
    const { values, validation } = setup({ error: { blur: gate.schema } });

    const pending = validation.run('email', { type: 'blur' });
    values.set('name', 'a');
    gate.release();

    const [valid] = await pending;
    expect(valid).toBe(false);
  });

  it('treats a change to an ancestor or a descendant of the target as overlapping', async () => {
    const gate = deferred([]);
    const { values, validation } = setup({ error: { blur: gate.schema } });

    const pending = validation.run('tags.0', { type: 'blur' });
    values.set('tags', ['x']);
    gate.release();

    expect(await pending).toEqual([true, {}]);
  });

  it('discards an older run when a newer run starts for the same targets and event', async () => {
    const older = deferred([{ message: 'Old', path: ['email'] }]);
    const newer = deferred([{ message: 'New', path: ['email'] }]);
    const schemas = [older.schema, newer.schema];
    const { validation, error } = setup({
      error: { blur: { '~standard': { ...schemas[0]!['~standard'], validate: v => schemas.shift()!['~standard'].validate(v) } } },
    });

    const first = validation.run('email', { type: 'blur' });
    const second = validation.run('email', { type: 'blur' });
    newer.release();
    older.release();

    expect(await first).toEqual([true, {}]);
    expect((await second)[1].error.map(entry => entry.message)).toEqual(['New']);
    expect(error.at('email').map(entry => entry.message)).toEqual(['New']);
  });

  it('keeps runs for different events or different targets side by side', async () => {
    const { validation, error } = setup({
      error: { blur: schemaWith([required]), focus: schemaWith([{ message: 'Name', path: ['name'] }]) },
    });

    const results = await Promise.all([validation.run('email', { type: 'blur' }), validation.run('name', { type: 'focus' })]);

    expect(results.map(([valid]) => valid)).toEqual([false, false]);
    expect(error.at('email')).toHaveLength(1);
    expect(error.at('name')).toHaveLength(1);
  });
});

describe('rejection', () => {
  it('rejects the run promise and clears its lane', async () => {
    const failing: StandardSchemaV1<any> = {
      '~standard': { version: 1, vendor: 'spike', validate: () => Promise.reject(new Error('boom')) },
    };
    const { validation } = setup({ error: { blur: failing } });

    await expect(validation.run('email', { type: 'blur' })).rejects.toThrow('boom');
  });

  it('does not report a rejected run to onRun', async () => {
    const failing: StandardSchemaV1<any> = {
      '~standard': { version: 1, vendor: 'spike', validate: () => Promise.reject(new Error('boom')) },
    };
    const { validation } = setup({ error: { blur: failing } });
    const listener = vi.fn();
    validation.onRun(listener);

    await validation.run('email', { type: 'blur' }).catch(() => undefined);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('scopes and paths', () => {
  it('emits only issues in the target scope, and descendants but not ancestors or siblings', async () => {
    const { validation } = setup({
      error: {
        blur: schemaWith([
          { message: 'self', path: ['tags'] },
          { message: 'child', path: ['tags', 0] },
          { message: 'sibling', path: ['name'] },
        ]),
      },
    });

    const [, issues] = await validation.run('tags', { type: 'blur' });
    expect(issues.error.map(entry => entry.message)).toEqual(['self', 'child']);

    const [, child] = await validation.run('tags.0', { type: 'blur' });
    expect(child.error.map(entry => entry.message)).toEqual(['child']);
  });

  it('reads Standard Schema { key } segments and numeric indices as the same dotted path', async () => {
    const { validation, error } = setup({
      error: { blur: schemaWith([{ message: 'Bad', path: [{ key: 'tags' }, { key: 0 }] }]) },
    });

    await validation.run(undefined, { type: 'blur' });

    expect(error.at('tags.0')).toHaveLength(1);
  });

  it('targets nothing for an empty array', async () => {
    const { validation, error } = setup({ error: { blur: schemaWith([required]) } });

    expect(await validation.run([], { type: 'blur' })).toEqual([true, { error: [], warning: [] }]);
    expect(error.at('email')).toEqual([]);
  });

  it('applies a pathless issue only to a whole-form run', async () => {
    const { validation, error } = setup({ error: { blur: schemaWith([{ message: 'Form level' }]) } });

    await validation.run('email', { type: 'blur' });
    expect(error.at('' as never)).toEqual([]);

    await validation.run(undefined, { type: 'blur' });
    expect(error.at('' as never)).toHaveLength(1);
  });

  it('runs every event for every check when no type is given', async () => {
    const { validation, error, warning } = setup({
      error: { change: schemaWith([{ message: 'E', path: ['email'] }]), submit: schemaWith([{ message: 'S', path: ['email'] }]) },
      warning: { focus: schemaWith([{ message: 'W', path: ['email'] }]) },
    });

    const [valid, issues] = await validation.run();

    expect(valid).toBe(false);
    expect(error.at('email').map(entry => entry.type)).toEqual(['change', 'submit']);
    expect(warning.at('email').map(entry => entry.type)).toEqual(['focus']);
    expect(issues.error).toHaveLength(2);
  });
});

describe('run validity', () => {
  it('covers issues emitted in this run, not preserved ones', async () => {
    const { validation, error } = setup({ error: { blur: schemaWith([]) } });
    error.set('name', [{ message: 'Manual' }]);

    const [valid] = await validation.run('email', { type: 'blur' });

    expect(valid).toBe(true);
    expect(error.at('name')).toHaveLength(1);
  });
});
