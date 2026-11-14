import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it, vi } from 'vitest';
import { configureForm, extendForm } from './form';
import { spikeForm as form } from './spike-form';

/** A schema that accepts anything and carries `Values` for inference. */
const schemaOf = <Values>(): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'spike', validate: value => ({ value: value as Values }) },
});

const rejecting = (message: string): StandardSchemaV1<any> => ({
  '~standard': { version: 1, vendor: 'spike', validate: () => ({ issues: [{ message, path: ['email'] }] }) },
});

type Login = { email: string; password: string };
const defaultValues: Login = { email: '', password: '' };

describe('configureForm', () => {
  const login = configureForm(form, { schema: schemaOf<Login>(), defaultValues, id: 'login' });

  it('creates an instance whose values come from defaultValues', () => {
    const instance = login();

    expect(instance.values.get()).toEqual(defaultValues);
    expect(instance.id).toBe('login');
    expect(instance.store.state).toMatchObject({ values: defaultValues, error: {} });
  });

  it('types values from the schema', () => {
    const instance = login();

    instance.values.set('email', 'a@b.c');
    // @ts-expect-error unknown path
    instance.values.set('nope', 'x');
    // @ts-expect-error wrong value type
    instance.values.set('email', 1);
  });

  it('rejects options that do not match the schema', () => {
    // @ts-expect-error defaultValues do not match the schema
    configureForm(form, { schema: schemaOf<Login>(), defaultValues: { email: 1 } });
  });

  it('gives each instance its own state', () => {
    const first = login();
    const second = login();

    first.values.set('email', 'a');
    expect(second.values.get('email')).toBe('');
  });

  it('lets instance options override configured options (later wins)', () => {
    const instance = login({ defaultValues: { email: 'x', password: '' }, id: 'other' });

    expect(instance.values.get('email')).toBe('x');
    expect(instance.id).toBe('other');
  });

  it('runs the error check from the configured option', async () => {
    const instance = configureForm(form, {
      schema: schemaOf<Login>(),
      defaultValues,
      error: { submit: rejecting('Required') },
    })();

    const [valid, issues] = await instance.validation.run(undefined, { type: 'submit' });

    expect(valid).toBe(false);
    expect(issues.error[0]?.message).toBe('Required');
    expect(instance.error.at('email')).toHaveLength(1);
  });

  it('stays valid with no error option', async () => {
    expect(await login().validation.run()).toEqual([true, { error: [] }]);
  });
});

describe('extendForm', () => {
  it('merges the extension api with the base api', () => {
    const extended = extendForm(form, {
      name: 'with-clear',
      api: (_ctx, base) => ({ clear: () => base.values.set('email', '') }),
    });
    const instance = configureForm(extended, { schema: schemaOf<Login>(), defaultValues: { email: 'a', password: '' } })();

    instance.clear();
    expect(instance.values.get('email')).toBe('');
    expect(instance.validation).toBeDefined();
  });
});

describe('destroy', () => {
  it('runs cleanups registered through the context', () => {
    const cleanup = vi.fn();
    const withCleanup = extendForm(form, {
      name: 'with-cleanup',
      api: ctx => (ctx.onDestroy(cleanup), {}),
    });
    const instance = configureForm(withCleanup, { schema: schemaOf<Login>(), defaultValues })();

    instance.destroy();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
