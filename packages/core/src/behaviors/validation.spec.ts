import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it, vi } from 'vite-plus/test';
import { contextInternals } from '#main/context';
import { defineExtension, defineForm, optionKindsOf } from '#main/form';
import type { Extendable, Needs } from '#main/types';
import { isWithin } from '#internal/paths';
import { reporting, schemaOf, type TestIssue } from '../../tests/helpers';
import { isDiscarded, isInScope, registerCheck, validation, type CheckValidators } from './validation';
import { values } from './values';
import type { CheckApi, CheckEntry } from './check';

type Profile = { email: string; name: string; tags: string[] };

const defaultValues: Profile = { email: '', name: '', tags: ['a'] };

/** A schema whose result waits until the test calls `release`. */
const deferred = (...issues: TestIssue[]) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => (release = resolve));
  const schema: StandardSchemaV1<never> = {
    '~standard': { version: 1, vendor: 'test', validate: async () => (await gate, { issues }) },
  };
  return { schema, release };
};

/** A schema that rejects. */
const failing: StandardSchemaV1<never> = {
  '~standard': { version: 1, vendor: 'test', validate: () => Promise.reject(new Error('boom')) },
};

type TestCheck = {
  readonly name: string;
  readonly validators?: CheckValidators<never>;
  readonly blocking?: boolean;
};

/** A test-local check: it registers through `registerCheck` and replaces every entry in the scope of a run. */
const testCheck =
  ({ name, validators = {}, blocking = true }: TestCheck) =>
  <Values>(form: Extendable<Values, Needs<Values, 'validation'>>) =>
    defineExtension(form, {
      name: `check:${name}`,
      needs: { api: ['validation'] },
      state: () => ({ [name]: {} as Readonly<Record<string, readonly CheckEntry[]>> }),
      api: (context, deps) => {
        const slice = context.state[name]!;
        const check: CheckApi<unknown> = {
          name,
          blocking,
          at: (path, options) =>
            Object.entries(slice.get())
              .filter(([key]) => (options?.nested ? isWithin(key, path) : key === path))
              .flatMap(([, found]) => found),
          set: (path, found) => slice.set(current => ({ ...current, [path]: found })),
          clear: () => slice.set({}),
          validates: event => event in validators,
        };
        registerCheck(deps.validation, {
          check,
          validatorFor: event => validators[event] as never,
          refresh: (_events, targets, incoming) =>
            slice.set(current => ({
              ...Object.fromEntries(Object.entries(current).filter(([key]) => !isInScope(key, targets))),
              ...Object.fromEntries(incoming),
            })),
        });
        return { [name]: check } as {};
      },
    });

type Extension = (form: Extendable<Profile, Needs<Profile, 'validation'>>) => unknown;

/** An instance of `values`, `validation` and the given test checks or extensions. */
const setup = (...extensions: (TestCheck | Extension)[]) => {
  let form = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(values).extend(validation);
  for (const item of extensions) form = form.extend((typeof item === 'function' ? item : testCheck(item)) as never);
  const instance = form.create();

  return {
    form,
    instance,
    // The test checks are not typed by name, so the issues are read by any name.
    run: (...args: Parameters<typeof instance.validation.run>) =>
      instance.validation.run(...args) as Promise<readonly [boolean, Readonly<Record<string, readonly CheckEntry[]>>]>,
    checkOf: (name: string) => (instance as unknown as Record<string, CheckApi<Profile>>)[name]!,
    [Symbol.dispose]: () => instance.destroy(),
  };
};

const messages = (entries: readonly CheckEntry[]) => entries.map(entry => entry.message);

describe('validation as an extension', () => {
  it('adds exactly the validation api, the validating state and no option', () => {
    using subject = setup();

    expect([Object.keys(subject.instance), subject.instance.store.state.validating, Object.keys(optionKindsOf(subject.form))]).toEqual([
      ['values', 'validation', 'id', 'store', 'destroy'],
      0,
      ['id', 'schema', 'defaultValues'],
    ]);
  });

  it('throws at create without values, and names validation and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(validation as never);

    expect(() => lacking.create()).toThrow('The "validation" extension needs "values", which no earlier extension provides.');
  });

  it('runs no validator at creation', () => {
    const validate = vi.fn(() => ({ issues: [] }));
    using _subject = setup({ name: 'error', validators: { change: { '~standard': { version: 1, vendor: 'test', validate } } } });

    expect(validate).not.toHaveBeenCalled();
  });

  it('refuses a check for an api that validation did not create', () => {
    using subject = setup();

    expect(() => registerCheck({ ...subject.instance.validation }, {} as never)).toThrow(
      'registerCheck expects a validation api made by the validation extension.',
    );
  });

  it('registers its api as the validation link of the instance', () => {
    const seen = vi.fn();
    using subject = setup(<Values>(form: Extendable<Values, Needs<Values, 'validation'>>) =>
      defineExtension(form, {
        name: 'reader',
        needs: { api: ['validation'] },
        api: context => (seen(contextInternals(context).validation()), {}),
      }),
    );

    expect(seen).toHaveBeenCalledWith(subject.instance.validation);
  });
});

describe('validation results', () => {
  it('finds a run valid with no check', async () => {
    using subject = setup();

    await expect(subject.run()).resolves.toEqual([true, {}]);
  });

  it('groups the issues by check name, and adds the event', async () => {
    using subject = setup(
      { name: 'error', validators: { change: reporting({ message: 'Required', path: ['email'] }) } },
      { name: 'warning', validators: {}, blocking: false },
    );

    await expect(subject.run(undefined, { type: 'change' })).resolves.toEqual([
      false,
      { error: [{ message: 'Required', path: ['email'], type: 'change' }], warning: [] },
    ]);
  });

  it('is valid when a schema returns a value and no issues', async () => {
    const passing: StandardSchemaV1<never> = {
      '~standard': { version: 1, vendor: 'test', validate: value => ({ value: value as never }) },
    };
    using subject = setup({ name: 'error', validators: { change: passing } });

    await expect(subject.run()).resolves.toEqual([true, { error: [] }]);
  });

  it('stays valid when only a check that does not block finds issues', async () => {
    using subject = setup({ name: 'warning', validators: { blur: reporting({ message: 'Hint', path: ['name'] }) }, blocking: false });
    const [valid] = await subject.run();

    expect(valid).toBe(true);
  });

  it('covers only the issues of this run', async () => {
    using subject = setup({ name: 'error', validators: { blur: reporting() } });
    subject.checkOf('error').set('name', [{ message: 'Manual' }]);
    const [valid] = await subject.run('email', { type: 'blur' });

    expect([valid, messages(subject.checkOf('error').at('name'))]).toEqual([true, ['Manual']]);
  });

  it('passes the full values to a validator function, also for a targeted run', async () => {
    const validator = vi.fn(() => reporting());
    using subject = setup({ name: 'error', validators: { change: validator } });
    await subject.run('email', { type: 'change' });

    expect(validator.mock.calls).toEqual([[{ values: defaultValues }]]);
  });
});

describe('validation targets', () => {
  const issues = [
    { message: 'self', path: ['tags'] },
    { message: 'child', path: ['tags', 0] },
    { message: 'sibling', path: ['name'] },
    { message: 'form' },
  ];

  it('holds every issue for a whole-form run, the pathless ones included', async () => {
    using subject = setup({ name: 'error', validators: { blur: reporting(...issues) } });
    const [, found] = await subject.run();

    expect(messages(found.error!)).toEqual(['self', 'child', 'sibling', 'form']);
  });

  it('holds a target and its descendants, and leaves out the siblings and the pathless issues', async () => {
    using subject = setup({ name: 'error', validators: { blur: reporting(...issues) } });
    const [, found] = await subject.run('tags');

    expect(messages(found.error!)).toEqual(['self', 'child']);
  });

  it('leaves out the ancestors of a target', async () => {
    using subject = setup({ name: 'error', validators: { blur: reporting(...issues) } });
    const [, found] = await subject.run('tags.0');

    expect(messages(found.error!)).toEqual(['child']);
  });

  it('holds each path of a list', async () => {
    using subject = setup({ name: 'error', validators: { blur: reporting(...issues) } });
    const [, found] = await subject.run(['name', 'tags.0']);

    expect(messages(found.error!)).toEqual(['child', 'sibling']);
  });

  it('targets nothing for an empty list', async () => {
    using subject = setup({ name: 'error', validators: { blur: reporting(...issues) } });

    await expect(subject.run([])).resolves.toEqual([true, { error: [] }]);
  });

  it('reads key segments and numeric indices as the same dotted path', async () => {
    using subject = setup({ name: 'error', validators: { blur: reporting({ message: 'Bad', path: [{ key: 'tags' }, { key: 0 }] }) } });
    await subject.run();

    expect(messages(subject.checkOf('error').at('tags.0'))).toEqual(['Bad']);
  });
});

describe('validation events', () => {
  const validators = {
    change: reporting({ message: 'change', path: ['email'] }),
    submit: reporting({ message: 'submit', path: ['email'] }),
  };

  it('uses every event in a run without a type', async () => {
    using subject = setup({ name: 'error', validators });
    const [, found] = await subject.run();

    expect(found.error!.map(entry => entry.type)).toEqual(['change', 'submit']);
  });

  it('uses only the event of a typed run', async () => {
    using subject = setup({ name: 'error', validators });
    const [, found] = await subject.run(undefined, { type: 'submit' });

    expect(messages(found.error!)).toEqual(['submit']);
  });

  it('leaves the entries of a check alone when it has no validator for the event', async () => {
    using subject = setup({ name: 'error', validators });
    subject.checkOf('error').set('email', [{ message: 'Manual' }]);
    await subject.run(undefined, { type: 'blur' });

    expect(messages(subject.checkOf('error').at('email'))).toEqual(['Manual']);
  });
});

describe('stale runs', () => {
  it('discard a run when an overlapping value changes, with an empty list per check', async () => {
    const gate = deferred({ message: 'Required', path: ['email'] });
    using subject = setup({ name: 'error', validators: { blur: gate.schema } });
    const pending = subject.run('email', { type: 'blur' });
    subject.instance.values.set('email', 'a');
    gate.release();

    expect([await pending, subject.checkOf('error').at('email')]).toEqual([[true, { error: [] }], []]);
  });

  it('mark the result of a discarded run, and only that one', async () => {
    const gate = deferred();
    using subject = setup({ name: 'error', validators: { blur: gate.schema } });
    const pending = subject.run(undefined, { type: 'blur' });
    subject.instance.values.set('name', 'a');
    gate.release();
    const discarded = await pending;

    expect([isDiscarded(discarded), isDiscarded(await subject.run('name', { type: 'focus' }))]).toEqual([true, false]);
  });

  it('discard a whole-form run for any change', async () => {
    const gate = deferred({ message: 'Required', path: ['email'] });
    using subject = setup({ name: 'error', validators: { blur: gate.schema } });
    const pending = subject.run(undefined, { type: 'blur' });
    subject.instance.values.set('name', 'a');
    gate.release();

    await expect(pending).resolves.toEqual([true, { error: [] }]);
  });

  it('discard a run when an ancestor of the target changes', async () => {
    const gate = deferred({ message: 'Bad', path: ['tags', 0] });
    using subject = setup({ name: 'error', validators: { blur: gate.schema } });
    const pending = subject.run('tags.0', { type: 'blur' });
    subject.instance.values.set('tags', ['b']);
    gate.release();

    await expect(pending).resolves.toEqual([true, { error: [] }]);
  });

  it('keep a targeted run when an unrelated value changes', async () => {
    const gate = deferred({ message: 'Required', path: ['email'] });
    using subject = setup({ name: 'error', validators: { blur: gate.schema } });
    const pending = subject.run('email', { type: 'blur' });
    subject.instance.values.set('name', 'a');
    gate.release();
    const [valid] = await pending;

    expect(valid).toBe(false);
  });

  it('discard an older run when a newer one starts for the same targets and event', async () => {
    const older = deferred({ message: 'Old', path: ['email'] });
    const newer = deferred({ message: 'New', path: ['email'] });
    const queue = [older.schema, newer.schema];
    using subject = setup({ name: 'error', validators: { blur: () => queue.shift()! } });
    const first = subject.run('email', { type: 'blur' });
    const second = subject.run('email', { type: 'blur' });
    newer.release();
    older.release();

    expect([await first, messages((await second)[1].error!), messages(subject.checkOf('error').at('email'))]).toEqual([
      [true, { error: [] }],
      ['New'],
      ['New'],
    ]);
  });

  it('keep the runs of other events and other targets side by side', async () => {
    using subject = setup({
      name: 'error',
      validators: {
        blur: reporting({ message: 'email', path: ['email'] }),
        focus: reporting({ message: 'name', path: ['name'] }),
      },
    });
    const results = await Promise.all([subject.run('email', { type: 'blur' }), subject.run('name', { type: 'focus' })]);

    expect(results.map(([valid]) => valid)).toEqual([false, false]);
  });
});

describe('rejected runs', () => {
  it('reject the run', async () => {
    using subject = setup({ name: 'error', validators: { blur: failing } });

    await expect(subject.run('email', { type: 'blur' })).rejects.toThrow('boom');
  });

  it('clear their lane, so the pending count goes back to zero', async () => {
    using subject = setup({ name: 'error', validators: { blur: failing } });
    await subject.run('email', { type: 'blur' }).catch(() => undefined);

    expect(subject.instance.validation.validating).toBe(false);
  });

  it('do not reach onRun', async () => {
    using subject = setup({ name: 'error', validators: { blur: failing } });
    const listener = vi.fn();
    subject.instance.validation.onRun(listener);
    await subject.run('email', { type: 'blur' }).catch(() => undefined);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('validating', () => {
  it('is true while a run is pending', async () => {
    const gate = deferred();
    using subject = setup({ name: 'error', validators: { blur: gate.schema } });
    const pending = subject.run(undefined, { type: 'blur' });
    const during = subject.instance.validation.validating;
    gate.release();
    await pending;

    expect([during, subject.instance.validation.validating]).toEqual([true, false]);
  });

  it('stays true until the last of two runs settles', async () => {
    const first = deferred();
    const second = deferred();
    const queue = [first.schema, second.schema];
    using subject = setup({ name: 'error', validators: { blur: () => queue.shift()! } });
    const runs = [subject.run('email', { type: 'blur' }), subject.run('name', { type: 'blur' })];
    first.release();
    await runs[0];
    const between = subject.instance.validation.validating;
    second.release();
    await runs[1];

    expect([between, subject.instance.validation.validating]).toEqual([true, false]);
  });
});

describe('onRun', () => {
  it('observes each applied run', async () => {
    using subject = setup({ name: 'error', validators: { change: reporting({ message: 'Required', path: ['email'] }) } });
    const listener = vi.fn();
    subject.instance.validation.onRun(listener);
    await subject.run('email', { type: 'change' });

    expect(listener).toHaveBeenCalledWith({
      targets: ['email'],
      type: 'change',
      valid: false,
      issues: { error: [{ message: 'Required', path: ['email'], type: 'change' }] },
    });
  });

  it('does not observe a discarded run', async () => {
    const gate = deferred();
    using subject = setup({ name: 'error', validators: { blur: gate.schema } });
    const listener = vi.fn();
    subject.instance.validation.onRun(listener);
    const pending = subject.run(undefined, { type: 'blur' });
    subject.instance.values.set('name', 'a');
    gate.release();
    await pending;

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops observing after it unsubscribes', async () => {
    using subject = setup();
    const listener = vi.fn();
    subject.instance.validation.onRun(listener)();
    await subject.run();

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('validation read path', () => {
  it('lists the checks in registration order', () => {
    using subject = setup({ name: 'error', validators: {} }, { name: 'warning', validators: {}, blocking: false });

    expect(subject.instance.validation.checks).toEqual([subject.checkOf('error'), subject.checkOf('warning')]);
  });

  it('reads the entries at a path and below, without validating', () => {
    const validate = vi.fn(() => ({ issues: [] }));
    using subject = setup({ name: 'error', validators: { change: { '~standard': { version: 1, vendor: 'test', validate } } } });
    subject.checkOf('error').set('tags.0', [{ message: 'Bad' }]);
    subject.checkOf('error').set('name', [{ message: 'Required' }]);

    expect([subject.instance.validation.issues(), subject.instance.validation.issues('tags'), validate.mock.calls.length]).toEqual([
      { error: [{ message: 'Bad' }, { message: 'Required' }] },
      { error: [{ message: 'Bad' }] },
      0,
    ]);
  });
});
