import { describe, expect, it, vi } from 'vite-plus/test';
import { defineForm, optionKindsOf } from '#main/form';
import { reporting, schemaOf } from '../../tests/helpers';
import { check, checkInternals, type CheckEntry } from './check';
import { validation, type CheckValidators } from './validation';
import { values } from './values';

type Profile = { email: string; name: string; tags: string[] };

const defaultValues: Profile = { email: '', name: '', tags: ['a', 'b', 'c'] };

/** An instance with an exclusive, blocking `error` check and a plain `warning` check. */
const setup = (options: { error?: CheckValidators<Profile>; warning?: CheckValidators<Profile> } = {}) => {
  const form = defineForm({ schema: schemaOf<Profile>(), defaultValues })
    .extend(values)
    .extend(validation)
    .extend(check('error', { blocking: true, exclusive: true }))
    .extend(check('warning'));
  const instance = form.create(options);

  return {
    form,
    instance,
    error: instance.error,
    warning: instance.warning,
    run: (...args: Parameters<typeof instance.validation.run>) => instance.validation.run(...args),
    [Symbol.dispose]: () => instance.destroy(),
  };
};

const messages = (entries: readonly CheckEntry[]) => entries.map(entry => entry.message);

describe('check as an extension', () => {
  it('takes its name from the argument, in the api, the options and the state', () => {
    using subject = setup();

    expect([subject.error.name, subject.warning.name, Object.keys(optionKindsOf(subject.form)), subject.instance.store.state]).toEqual([
      'error',
      'warning',
      ['id', 'schema', 'defaultValues', 'error', 'warning'],
      expect.objectContaining({ error: {}, warning: {} }),
    ]);
  });

  it('refuses a second check with the same name', () => {
    using subject = setup();

    expect(() => subject.form.extend(check('error'))).toThrow(
      'The "check:error" extension declares the option "error", which "check:error" already declares.',
    );
  });

  it('throws at create without validation, and names itself and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues })
      .extend(values)
      .extend(check('error') as never);

    expect(() => lacking.create()).toThrow('The "check:error" extension needs "validation", which no earlier extension provides.');
  });

  it('runs no validator of its option at creation', () => {
    const validate = vi.fn(() => ({ issues: [] }));
    using _subject = setup({ error: { change: { '~standard': { version: 1, vendor: 'test', validate } } } });

    expect(validate).not.toHaveBeenCalled();
  });
});

describe('an exclusive check', () => {
  it('replaces every entry in the scope of a run, also the ones set by hand', async () => {
    using subject = setup({ error: { change: reporting({ message: 'Required', path: ['email'] }) } });
    subject.error.set('email', [{ message: 'Manual' }]);
    await subject.run('email', { type: 'change' });

    expect(subject.error.at('email')).toEqual([{ message: 'Required', path: ['email'], type: 'change' }]);
  });

  it('leaves the entries alone when it has no validator for the event', async () => {
    using subject = setup({ error: { change: reporting({ message: 'Required', path: ['email'] }) } });
    subject.error.set('email', [{ message: 'Manual' }]);
    await subject.run(undefined, { type: 'blur' });

    expect(messages(subject.error.at('email'))).toEqual(['Manual']);
  });
});

describe('a check that is not exclusive', () => {
  it('refreshes the entries of the event of the run, and keeps other events and untyped entries', async () => {
    using subject = setup({ warning: { blur: reporting({ message: 'Weak', path: ['email'] }) } });
    subject.warning.set('email', [{ message: 'Manual' }, { message: 'From change', type: 'change' }]);
    await subject.run('email', { type: 'blur' });
    await subject.run('email', { type: 'blur' });

    expect(messages(subject.warning.at('email'))).toEqual(['Manual', 'From change', 'Weak']);
  });

  it('keeps the entries of an event without a validator until clear', async () => {
    using subject = setup({ warning: { blur: reporting() } });
    subject.warning.set('email', [{ message: 'Old', type: 'change' }]);
    await subject.run('email');
    const kept = messages(subject.warning.at('email'));
    subject.warning.clear('email');

    expect([kept, subject.warning.at('email')]).toEqual([['Old'], []]);
  });
});

describe('the scope of a run', () => {
  it('keeps the entries outside the scope', async () => {
    using subject = setup({ error: { change: reporting({ message: 'Required', path: ['email'] }) } });
    subject.error.set('name', [{ message: 'Manual' }]);
    await subject.run('email', { type: 'change' });

    expect(messages(subject.error.at('name'))).toEqual(['Manual']);
  });

  it('holds the descendants of a target, which a nested read finds', async () => {
    using subject = setup({ error: { change: reporting({ message: 'Bad', path: ['tags', 1] }) } });
    subject.error.set('name', [{ message: 'Other' }]);
    await subject.run('tags', { type: 'change' });

    expect([subject.error.at('tags'), messages(subject.error.at('tags', { nested: true }))]).toEqual([[], ['Bad']]);
  });
});

describe('check.set', () => {
  it('replaces by default, and appends in append mode', () => {
    using subject = setup();
    subject.error.set('email', [{ message: 'a' }]);
    subject.error.set('email', [{ message: 'b' }], { mode: 'append' });

    expect(messages(subject.error.at('email'))).toEqual(['a', 'b']);
  });

  it('keeps existing entries in keep mode, and sets them when there are none', () => {
    using subject = setup();
    subject.error.set('email', [{ message: 'a' }]);
    subject.error.set('email', [{ message: 'b' }], { mode: 'keep' });
    subject.error.set('name', [{ message: 'c' }], { mode: 'keep' });

    expect([messages(subject.error.at('email')), messages(subject.error.at('name'))]).toEqual([['a'], ['c']]);
  });

  it('removes the path when it sets no entry', () => {
    using subject = setup();
    subject.error.set('email', [{ message: 'a' }]);
    subject.error.set('email', []);

    expect(subject.instance.store.state.error).toEqual({});
  });

  it('stores the entries at its path, not at the path of an entry', () => {
    using subject = setup();
    subject.error.set('email', [{ message: 'a', path: ['name'] }]);

    expect([messages(subject.error.at('email')), subject.error.at('name')]).toEqual([['a'], []]);
  });
});

describe('blocking', () => {
  it('makes a run invalid for a check that blocks', async () => {
    using subject = setup({ error: { blur: reporting({ message: 'Required', path: ['email'] }) } });
    const [valid] = await subject.run();

    expect(valid).toBe(false);
  });

  it('keeps a run valid for a check that does not say it blocks', async () => {
    using subject = setup({ warning: { blur: reporting({ message: 'Weak', path: ['email'] }) } });
    const [valid] = await subject.run();

    expect([valid, subject.warning.blocking]).toEqual([true, false]);
  });

  it('keeps the entries of another check', async () => {
    using subject = setup({ warning: { blur: reporting({ message: 'Weak', path: ['email'] }) } });
    subject.error.set('email', [{ message: 'Manual error' }]);
    await subject.run('email', { type: 'blur' });

    expect([messages(subject.error.at('email')), messages(subject.warning.at('email'))]).toEqual([['Manual error'], ['Weak']]);
  });
});

describe('validates and clear', () => {
  it('says which events have a validator', () => {
    using subject = setup({ error: { blur: reporting() } });

    expect([subject.error.validates('blur'), subject.error.validates('change')]).toEqual([true, false]);
  });

  it('reads the validators of the current options', () => {
    using subject = setup();

    expect(subject.warning.validates('submit')).toBe(false);
  });

  it('clears one subtree', () => {
    using subject = setup();
    subject.error.set('tags.0', [{ message: 'a' }]);
    subject.error.set('name', [{ message: 'b' }]);
    subject.error.clear('tags');

    expect(subject.instance.store.state.error).toEqual({ name: [{ message: 'b' }] });
  });

  it('clears every entry without a path', () => {
    using subject = setup();
    subject.error.set('', [{ message: 'root' }]);
    subject.error.set('name', [{ message: 'b' }]);
    subject.error.clear();

    expect(subject.instance.store.state.error).toEqual({});
  });
});

describe('root issues', () => {
  it('are set and read at the empty path, which a nested read of the root includes', () => {
    using subject = setup();
    subject.error.set('', [{ message: 'Form' }]);
    subject.error.set('name', [{ message: 'Name' }]);

    expect([messages(subject.error.at('')), messages(subject.error.at('', { nested: true }))]).toEqual([['Form'], ['Form', 'Name']]);
  });

  it('are replaced by a whole-form run', async () => {
    using subject = setup({ error: { submit: reporting({ message: 'Server' }) } });
    subject.error.set('', [{ message: 'Manual' }]);
    await subject.run(undefined, { type: 'submit' });

    expect(messages(subject.error.at(''))).toEqual(['Server']);
  });

  it('are kept by a targeted run', async () => {
    using subject = setup({ error: { submit: reporting({ message: 'Server' }) } });
    subject.error.set('', [{ message: 'Manual' }]);
    await subject.run('email', { type: 'submit' });

    expect(messages(subject.error.at(''))).toEqual(['Manual']);
  });
});

describe('entries of array items', () => {
  /** Entries at `tags.0`, `tags.1.deep` and `tags.2`, and one outside the array. */
  const seed = (subject: ReturnType<typeof setup>) => {
    subject.error.set('tags.0', [{ message: 'zero' }]);
    subject.error.set('tags.1.deep' as never, [{ message: 'one' }]);
    subject.error.set('tags.2', [{ message: 'two' }]);
    subject.error.set('name', [{ message: 'name' }]);
  };

  it('follow a swap', () => {
    using subject = setup();
    seed(subject);
    checkInternals(subject.error).remap('tags', index => [2, 1, 0][index]);

    expect([messages(subject.error.at('tags.0')), messages(subject.error.at('tags.2'))]).toEqual([['two'], ['zero']]);
  });

  it('follow a move', () => {
    using subject = setup();
    seed(subject);
    checkInternals(subject.error).remap('tags', index => [1, 2, 0][index]);

    expect(messages(subject.error.at('tags.2.deep' as never))).toEqual(['one']);
  });

  it('follow a prepend and an insert', () => {
    using subject = setup();
    seed(subject);
    checkInternals(subject.error).remap('tags', index => index + 1);

    expect(messages(subject.error.at('tags.3'))).toEqual(['two']);
  });

  it('are dropped for a removed item', () => {
    using subject = setup();
    seed(subject);
    checkInternals(subject.error).remap('tags', index => (index === 0 ? undefined : index - 1));

    expect(subject.instance.store.state.error).toEqual({
      'tags.0.deep': [{ message: 'one' }],
      'tags.1': [{ message: 'two' }],
      name: [{ message: 'name' }],
    });
  });
});
