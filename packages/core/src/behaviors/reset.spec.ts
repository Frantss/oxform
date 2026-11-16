import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vite-plus/test';
import { isWithin } from '#internal/paths';
import { defineExtension, defineForm } from '#main/form';
import type { Extendable, Needs } from '#main/types';
import { schemaOf } from '../../tests/helpers';
import type { CheckApi, CheckEntry } from './check';
import { events, eventsInternals } from './events';
import { reset } from './reset';
import { status, statusInternals } from './status';
import { isInScope, registerCheck, validation } from './validation';
import { values } from './values';

type Profile = { name: string; address: { city: string; zip: string } };

const defaultValues: Profile = { name: '', address: { city: '', zip: '' } };

type LocalCheck = {
  readonly name: string;
  readonly blocking: boolean;
  at(path: string): readonly CheckEntry[];
  set(path: string, entries: readonly CheckEntry[]): void;
  clear(path?: string): void;
  validates(): boolean;
};

/** A test-local check: entries in a state slice of its name, and an optional blur validator. */
const localCheck =
  (name: string, blur?: StandardSchemaV1<never>) =>
  <Values>(form: Extendable<Values, Needs<Values, 'validation'>>) =>
    defineExtension(form, {
      name: `check:${name}`,
      needs: { api: ['validation'] },
      state: () => ({ [name]: {} as Readonly<Record<string, readonly CheckEntry[]>> }),
      api: (context, deps) => {
        const slice = context.state[name]!;
        const check: LocalCheck = {
          name,
          blocking: true,
          at: (path: string) => slice.get()[path] ?? [],
          set: (path: string, entries: readonly CheckEntry[]) => slice.set(current => ({ ...current, [path]: entries })),
          clear: (path = '') => slice.set(current => Object.fromEntries(Object.entries(current).filter(([key]) => !isWithin(key, path)))),
          validates: () => blur !== undefined,
        };
        registerCheck(deps.validation, {
          check: check as unknown as CheckApi<unknown>,
          validatorFor: event => (event === 'blur' ? blur : undefined),
          refresh: (_events, targets, incoming) =>
            slice.set(current => ({
              ...Object.fromEntries(Object.entries(current).filter(([key]) => !isInScope(key, targets))),
              ...Object.fromEntries(incoming),
            })),
        });
        return {} as {};
      },
    });

/** A schema whose result waits until the test calls `release`. */
const deferred = () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => (release = resolve));
  const schema: StandardSchemaV1<never> = {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate: async () => (await gate, { issues: [{ message: 'Late', path: ['name'] }] }),
    },
  };
  return { schema, release };
};

/** `values`, `status`, `events` and `reset`, or with `validation` and the checks `error` and `warning` first. */
const setup = ({ checked = false, blur }: { checked?: boolean; blur?: StandardSchemaV1<never> } = {}) => {
  const base = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(values);
  const plain = base.extend(status).extend(events).extend(reset);
  const instance = checked
    ? base.extend(validation).extend(localCheck('error', blur)).extend(localCheck('warning')).extend(status).extend(events).extend(reset).create()
    : plain.create();
  const validated = instance as typeof instance & {
    validation: { run(path?: string, options?: object): Promise<unknown>; checks: readonly LocalCheck[] };
  };

  return {
    instance,
    form: plain,
    status: statusInternals(instance.status),
    refs: eventsInternals(instance.events),
    entries: (name: string, path: string) =>
      (instance.store.state as unknown as Record<string, Record<string, readonly CheckEntry[]>>)[name]![path] ?? [],
    checkOf: (name: string) => validated.validation.checks.find(check => check.name === name)!,
    validation: validated.validation,
    [Symbol.dispose]: () => instance.destroy(),
  };
};

/** An element that does nothing. */
const element = {} as HTMLElement;

describe('reset as an extension', () => {
  it.each(['values', 'status', 'events'] as const)('throws at create without %s, and names reset and the need', need => {
    using _subject = setup();
    const root = defineForm({ schema: schemaOf<Profile>(), defaultValues });
    const partial = { values: root, status: root.extend(values), events: root.extend(values).extend(status) }[need];
    const lacking = (partial as unknown as { extend(extension: unknown): { create(): unknown } }).extend(reset);

    expect(() => lacking.create()).toThrow(`The "reset" extension needs "${need}", which no earlier extension provides.`);
  });

  it('resets the form on a chain without validation', () => {
    using subject = setup();
    subject.instance.events.change('name', 'a');
    subject.instance.reset.all();

    expect([subject.instance.values.get('name'), subject.instance.status.form.dirty]).toEqual(['', false]);
  });
});

describe('reset.all', () => {
  it('restores the default values, the field state, the entries and the form status', () => {
    using subject = setup({ checked: true });
    subject.instance.events.change('address.city', 'Paris');
    subject.checkOf('error').set('name', [{ message: 'Bad' }]);
    subject.status.setForm({ submits: 2, successful: false });
    subject.instance.reset.all();

    expect([
      subject.instance.values.get(),
      subject.instance.status.at('address.city').dirty,
      subject.entries('error', 'name'),
      subject.instance.status.form,
    ]).toEqual([defaultValues, false, [], expect.objectContaining({ submits: 0, successful: null, dirty: false })]);
  });

  it('starts from given values and keeps the default values', () => {
    using subject = setup();
    subject.instance.reset.all({ values: { ...defaultValues, name: 'given' } });
    const given = subject.instance.values.get('name');
    subject.instance.reset.all();

    expect([given, subject.instance.values.get('name'), subject.instance.status.at('name').default]).toEqual(['given', '', true]);
  });

  it('applies a status override', () => {
    using subject = setup();
    subject.instance.reset.all({ status: { submits: 5 } });

    expect(subject.instance.status.form.submits).toBe(5);
  });

  it('keeps the entries of the listed checks', () => {
    using subject = setup({ checked: true });
    subject.checkOf('error').set('name', [{ message: 'Bad' }]);
    subject.checkOf('warning').set('name', [{ message: 'Weak' }]);
    subject.instance.reset.all({ keep: { checks: ['error'] } });

    expect([subject.entries('error', 'name').length, subject.entries('warning', 'name').length]).toEqual([1, 0]);
  });

  it('keeps the entries of every check', () => {
    using subject = setup({ checked: true });
    subject.checkOf('warning').set('name', [{ message: 'Weak' }]);
    subject.instance.reset.all({ keep: { checks: true } });

    expect(subject.entries('warning', 'name')).toHaveLength(1);
  });

  it('clears the element refs, and keeps them with keep.refs', () => {
    using subject = setup();
    subject.instance.events.register('name')(element);
    subject.instance.reset.all({ keep: { refs: true } });
    const kept = subject.refs.ref('name');
    subject.instance.reset.all();

    expect([kept, subject.refs.ref('name')]).toEqual([element, null]);
  });

  it('keeps the field state, the entries and the refs with keep.fields, over the other flags', () => {
    using subject = setup({ checked: true });
    subject.instance.events.change('name', 'a');
    subject.instance.events.register('name')(element);
    subject.checkOf('error').set('name', [{ message: 'Bad' }]);
    subject.instance.reset.all({ keep: { fields: true, checks: false, refs: false } });

    expect([
      subject.instance.status.at('name').dirty,
      subject.entries('error', 'name').length,
      subject.refs.ref('name'),
      subject.instance.values.get('name'),
    ]).toEqual([true, 1, element, '']);
  });
});

describe('reset.at', () => {
  it('restores the default value of a subtree, its field state and its entries, and keeps the siblings', () => {
    using subject = setup({ checked: true });
    subject.instance.events.change('address.city', 'Paris');
    subject.instance.events.change('name', 'Ada');
    subject.checkOf('error').set('address.city', [{ message: 'Bad' }]);
    subject.instance.reset.at('address');

    expect([
      subject.instance.values.get(),
      subject.instance.status.at('address.city').dirty,
      subject.entries('error', 'address.city'),
      subject.instance.status.at('name').dirty,
    ]).toEqual([{ ...defaultValues, name: 'Ada' }, false, [], true]);
  });

  it('writes a given value', () => {
    using subject = setup();
    subject.instance.reset.at('name', { value: 'given' });

    expect(subject.instance.values.get('name')).toBe('given');
  });
});

describe('reset and validation', () => {
  it('discards a pending run', async () => {
    const gate = deferred();
    using subject = setup({ checked: true, blur: gate.schema });
    const pending = subject.validation.run('name', { type: 'blur' });
    subject.instance.events.change('name', 'a', { should: { validate: false } });
    subject.instance.reset.all();
    gate.release();
    await pending;

    expect(subject.entries('error', 'name')).toEqual([]);
  });

  it('discards a pending run when the values are already the defaults', async () => {
    const gate = deferred();
    using subject = setup({ checked: true, blur: gate.schema });
    const pending = subject.validation.run('name', { type: 'blur' });
    subject.instance.reset.all();
    gate.release();
    await pending;

    expect(subject.entries('error', 'name')).toEqual([]);
  });

  it('discards a pending run of a path that reset.at resets to an equal value', async () => {
    const gate = deferred();
    using subject = setup({ checked: true, blur: gate.schema });
    const pending = subject.validation.run('name', { type: 'blur' });
    subject.instance.reset.at('name');
    gate.release();
    await pending;

    expect(subject.entries('error', 'name')).toEqual([]);
  });

  it('does not validate', () => {
    using subject = setup({ checked: true, blur: deferred().schema });
    subject.instance.events.change('name', 'a', { should: { validate: false } });
    subject.instance.reset.all();

    expect(subject.instance.status.form.validating).toBe(false);
  });
});
