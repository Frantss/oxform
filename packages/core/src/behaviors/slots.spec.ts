import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { defineExtension, defineForm, slots, slotsOf } from '#main/form';
import type { Extendable } from '#main/types';
import { schemaOf } from '../../tests/helpers';
import { check } from './check';
import { events, eventsInternals } from './events';
import { reset } from './reset';
import { fieldErrorSlots, fieldSlots, resetSlots, rootSlots, submitSlots } from './slots';
import { status } from './status';
import { submit } from './submit';
import { validation } from './validation';
import { values } from './values';

type Profile = { name: string; agree: boolean; age: number | undefined; files: unknown; tags: string[] };

const defaultValues: Profile = { name: 'Ada', agree: false, age: 1, files: null, tags: [] };

type SlotFunctions = {
  readonly element?: string;
  attrs?(state: unknown, part: object): Record<string, unknown>;
  state?(state: unknown, part: object): unknown;
  present?(state: unknown, part: object): boolean;
  text?(state: unknown): string | undefined;
  on?: Readonly<Record<string, (event: unknown, context: object) => void>>;
  bind?(element: unknown, part: object): () => void;
};

const root = () => defineForm({ schema: schemaOf<Profile>(), defaultValues });

/** The lean sign-in: `submit` and the `error` check, no `reset`. */
const lean = () =>
  root()
    .extend(values)
    .extend(validation)
    .extend(check('error', { blocking: true }))
    .extend(status)
    .extend(events)
    .extend(submit)
    .extend(slots(slot => ({ ...rootSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot) })));

/** The member filter: `values`, `status`, `events` and no check. */
const filter = () =>
  root()
    .extend(values)
    .extend(status)
    .extend(events)
    .extend(slots(slot => ({ ...fieldSlots(slot) })));

/** A form with `reset` and its button. */
const resettable = () =>
  root()
    .extend(values)
    .extend(status)
    .extend(events)
    .extend(reset)
    .extend(slots(slot => ({ ...resetSlots(slot) })));

const chains = { lean, filter, resettable };

/** An instance of a chain, and its slots as plain functions over the store state. */
const setup = (chain: keyof typeof chains = 'lean', options: { onSubmit?: () => unknown } = {}) => {
  const form = chains[chain]();
  const instance = (form as ReturnType<typeof lean>).create({ id: 'sign-in', ...options }) as ReturnType<ReturnType<typeof lean>['create']> &
    ReturnType<ReturnType<typeof resettable>['create']>;
  const slotOf = (name: string) => slotsOf(form)[name] as unknown as SlotFunctions;
  const part = (key = 'name', props: object = {}) => ({ id: instance.id, key, props, api: instance });

  return {
    form,
    instance,
    slot: slotOf,
    part,
    attrs: (name: string, key?: string, props?: object) => slotOf(name).attrs!(instance.store.state, part(key, props)),
    /** Calls the handler of a DOM event with a stand-in event and element. */
    fire: (name: string, type: string, element: object = {}, event: object = {}, key = 'name') => {
      const preventDefault = vi.fn();
      slotOf(name).on![type]!({ preventDefault, ...event }, { ...part(key), element });
      return preventDefault;
    },
    [Symbol.dispose]: () => instance.destroy(),
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('slot groups', () => {
  it('resolve one key per part, each with its default element', () => {
    using _subject = setup();
    const groups = [rootSlots, fieldSlots, fieldErrorSlots, submitSlots, resetSlots].map(group =>
      Object.entries(group(definition => definition as never) as object).map(([key, slot]) => [key, (slot as SlotFunctions).element]),
    );

    expect(groups).toEqual([
      [['root', 'form']],
      [['field', 'input']],
      [
        ['field', 'input'],
        ['fieldError', 'p'],
      ],
      [['submit', 'button']],
      [['reset', 'button']],
    ]);
  });

  it('give a form only the parts of the groups it spreads', () => {
    using subject = setup('filter');

    expect(Object.keys(slotsOf(subject.form))).toEqual(['field']);
  });
});

/** An extension that gives the named api members and state keys, each an empty object. */
const providing = (api: readonly string[], state: readonly string[]) => (form: Extendable<unknown>) =>
  defineExtension(form, {
    name: 'providing',
    state: () => Object.fromEntries(state.map(key => [key, {}])),
    api: () => Object.fromEntries(api.map(key => [key, {}])),
  });

const groups = { rootSlots, fieldSlots, fieldErrorSlots, submitSlots, resetSlots };

describe('slot group needs', () => {
  it.each([
    ['rootSlots', 'api', 'submit', [], []],
    ['resetSlots', 'api', 'reset', [], []],
    ['submitSlots', 'state', 'status', [], []],
    ['fieldSlots', 'api', 'events', ['values'], ['values', 'status']],
    ['fieldSlots', 'api', 'values', ['events'], ['values', 'status']],
    ['fieldSlots', 'state', 'values', ['events', 'values'], ['status']],
    ['fieldSlots', 'state', 'status', ['events', 'values'], ['values']],
    ['fieldErrorSlots', 'api', 'events', ['values'], ['values', 'status', 'error']],
    ['fieldErrorSlots', 'api', 'values', ['events'], ['values', 'status', 'error']],
    ['fieldErrorSlots', 'state', 'values', ['events', 'values'], ['status', 'error']],
    ['fieldErrorSlots', 'state', 'status', ['events', 'values'], ['values', 'error']],
    ['fieldErrorSlots', 'state', 'error', ['events', 'values'], ['values', 'status']],
  ] as const)('throw at create when %s lacks the %s need %s, and name the group and the need', (group, kind, need, api, state) => {
    using _subject = setup();
    const form = root()
      .extend(providing(api, state))
      .extend(slots(slot => ({ ...groups[group](slot as never) })));
    const named = kind === 'api' ? `"${need}"` : `the state key "${need}"`;

    expect(() => form.create()).toThrow(`The "${group}" slot group needs ${named}, which no earlier extension provides.`);
  });
});

describe('fieldSlots', () => {
  it('give the field element its id, name, value and status flags', () => {
    using subject = setup('filter');
    subject.instance.events.change('name', 'Grace');

    expect(subject.attrs('field')).toEqual({
      id: 'sign-in-name',
      name: 'name',
      value: 'Grace',
      'aria-invalid': undefined,
      'aria-describedby': undefined,
      'data-dirty': '',
      'data-touched': '',
      'data-blurred': undefined,
    });
  });

  it('show the value by the type of the part', () => {
    using subject = setup('filter');
    subject.instance.values.set('age', undefined);

    expect([
      subject.attrs('field', 'agree', { type: 'checkbox' }).checked,
      subject.attrs('field', 'name', { type: 'radio', value: 'Ada' }),
      'value' in subject.attrs('field', 'files', { type: 'file' }),
      subject.attrs('field', 'age').value,
    ]).toEqual([false, expect.objectContaining({ checked: true, value: 'Ada' }), false, '']);
  });

  it('give no status flag to a path that the form does not know', () => {
    using subject = setup('filter');

    expect(subject.attrs('field', 'unknown')['aria-invalid']).toBeUndefined();
  });

  it('write the value of an input by its type on input', () => {
    using subject = setup('filter');
    const written = [
      [{ type: 'text', value: 'Grace' }, 'name'],
      [{ type: 'number', value: '', valueAsNumber: Number.NaN }, 'age'],
      [{ type: 'range', value: '5', valueAsNumber: 5 }, 'age'],
      [{ type: 'file', files: ['a'] }, 'files'],
      [{ type: 'file', multiple: true, files: ['a', 'b'] }, 'files'],
      [{ type: 'file', files: null }, 'files'],
      [{ type: 'file', multiple: true, files: null }, 'files'],
      [{ type: 'select-multiple', selectedOptions: [{ value: 'x' }] }, 'tags'],
    ] as const;
    const seen = written.map(([element, key]) => {
      subject.fire('field', 'input', element, {}, key);
      return subject.instance.values.get(key);
    });

    expect(seen).toEqual(['Grace', undefined, 5, 'a', ['a', 'b'], null, [], ['x']]);
  });

  it('read a toggle on click and not on input, and other inputs on input only', () => {
    using subject = setup('filter');
    subject.fire('field', 'input', { type: 'checkbox', checked: true }, {}, 'agree');
    const afterInput = subject.instance.values.get('agree');
    subject.fire('field', 'click', { type: 'checkbox', checked: true }, {}, 'agree');
    subject.fire('field', 'click', { type: 'text', value: 'clicked' });

    expect([afterInput, subject.instance.values.get('agree'), subject.instance.values.get('name')]).toEqual([false, true, 'Ada']);
  });

  it('mark the field on focus and blur', () => {
    using subject = setup('filter');
    subject.fire('field', 'focus');
    subject.fire('field', 'blur');

    expect([subject.instance.status.at('name'), subject.attrs('field')['data-blurred']]).toEqual([
      expect.objectContaining({ touched: true, blurred: true }),
      '',
    ]);
  });

  it('register the element at bind, and unregister it at cleanup', () => {
    using subject = setup('filter');
    const element = { type: 'text' };
    const cleanup = subject.slot('field').bind!(element, subject.part());
    const registered = eventsInternals(subject.instance.events).ref('name');
    cleanup();

    expect([registered, eventsInternals(subject.instance.events).ref('name')]).toEqual([element, null]);
  });

  it('empty a file input at a reset of its path only', () => {
    using subject = setup('filter');
    const file = { type: 'file', value: 'a.txt' };
    const text = { type: 'text', value: 'kept' };
    subject.slot('field').bind!(file, subject.part('files'));
    subject.slot('field').bind!(text, subject.part('name'));
    subject.instance.values.set('files', 'other');
    subject.instance.values.set('name', 'reset', { reason: 'reset' });
    const beforeReset = file.value;
    subject.instance.values.set('files', null, { reason: 'reset' });

    expect([beforeReset, file.value, text.value]).toEqual(['a.txt', '', 'kept']);
  });
});

describe('fieldErrorSlots', () => {
  it('describe the field and mark it invalid while the path has errors', () => {
    using subject = setup();
    const before = subject.attrs('field');
    subject.instance.error.set('name', [{ message: 'Taken' }]);
    const after = subject.attrs('field');

    expect([before['aria-describedby'], after['aria-describedby'], after['aria-invalid']]).toEqual([undefined, 'sign-in-name-error', true]);
  });

  it('give the error part no message for a path with no entries', () => {
    using subject = setup();

    expect(subject.slot('fieldError').state!(subject.instance.store.state, subject.part())).toEqual({ messages: [] });
  });

  it('show the error part only with errors, with its id, its role and the first message', () => {
    using subject = setup();
    const error = subject.slot('fieldError');
    const absent = error.present!(subject.instance.store.state, subject.part());
    subject.instance.error.set('name', [{ message: 'Taken' }, { message: 'Short' }]);
    const state = error.state!(subject.instance.store.state, subject.part());

    expect([absent, error.present!(subject.instance.store.state, subject.part()), state, error.text!(state), subject.attrs('fieldError')]).toEqual([
      false,
      true,
      { messages: ['Taken', 'Short'] },
      'Taken',
      { id: 'sign-in-name-error', role: 'alert' },
    ]);
  });
});

describe('submitSlots', () => {
  it('give the button its type, and disable it while submitting', () => {
    using subject = setup();
    const idle = subject.attrs('submit');
    void subject.instance.submit.run();

    expect([idle, subject.attrs('submit')]).toEqual([
      { type: 'submit', disabled: undefined, 'data-submitting': undefined },
      { type: 'submit', disabled: true, 'data-submitting': '' },
    ]);
  });

  it('expose the submit status to the children', () => {
    using subject = setup();

    expect(subject.slot('submit').state!(subject.instance.store.state, subject.part())).toEqual({
      submitting: false,
      submits: 0,
      successful: null,
    });
  });
});

describe('rootSlots', () => {
  it('prevent the default of submit, and submit with the value of the submitter', async () => {
    const onSubmit = vi.fn();
    using subject = setup('lean', { onSubmit });
    const prevented = subject.fire('root', 'submit', {}, { submitter: { value: 'draft' } });
    subject.fire('root', 'submit', {}, { submitter: null });
    // A run during a submit returns the submit in progress.
    await subject.instance.submit.run();

    expect([prevented.mock.calls.length, onSubmit.mock.calls[0]?.[2]]).toEqual([1, 'draft']);
  });

  it('submit without an intent when the submitter has no value', async () => {
    const onSubmit = vi.fn();
    using subject = setup('lean', { onSubmit });
    subject.fire('root', 'submit', {}, { submitter: { value: '' } });
    // A run during a submit returns the submit in progress.
    await subject.instance.submit.run();

    expect(onSubmit.mock.calls[0]?.[2]).toBeUndefined();
  });

  it('report a rejected submit as an error of an event handler (G16)', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    using subject = setup('lean', {
      onSubmit: () => {
        throw new Error('network');
      },
    });
    subject.fire('root', 'submit', {}, { submitter: null });
    await subject.instance.submit.run().catch(() => {});

    expect(reportError).toHaveBeenCalledWith(new Error('network'));
  });

  it('prevent the default of reset, on a chain with no reset', () => {
    using subject = setup();

    expect(subject.fire('root', 'reset')).toHaveBeenCalledOnce();
  });
});

describe('resetSlots', () => {
  it('give the button its type, and reset the form on click', () => {
    using subject = setup('resettable');
    subject.instance.values.set('name', 'Grace');
    const prevented = subject.fire('reset', 'click');

    expect([subject.attrs('reset'), prevented.mock.calls.length, subject.instance.values.get('name')]).toEqual([{ type: 'reset' }, 1, 'Ada']);
  });
});
