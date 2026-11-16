import { describe, expect, it, vi } from 'vite-plus/test';
import { defineForm } from '#main/form';
import { reporting, schemaOf } from '../../tests/helpers';
import { check } from './check';
import { events, eventsInternals } from './events';
import { status } from './status';
import { validation, type CheckValidators } from './validation';
import { values } from './values';

type Profile = { name: string; address: { city: string } };

const defaultValues: Profile = { name: '', address: { city: '' } };

/** An element that records the calls of `focus` and `blur`. */
const elementOf = (calls: string[]) => ({ focus: () => calls.push('focus'), blur: () => calls.push('blur') }) as unknown as HTMLElement;

/** `values`, `status` and `events`, or with `validation` and an `error` check that takes `error` as validators. */
const setup = (error?: CheckValidators<Profile>) => {
  const base = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(values);
  const checked = base.extend(validation).extend(check('error')).extend(status).extend(events);
  const plain = base.extend(status).extend(events);
  const instance = error ? checked.create({ error }) : plain.create();
  const validated = instance as ReturnType<typeof checked.create>;

  return {
    form: plain,
    instance,
    validation: validated.validation,
    error: validated.error,
    [Symbol.dispose]: () => instance.destroy(),
  };
};

describe('events as an extension', () => {
  it('throws at create without values, and names events and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(events as never);

    expect(() => lacking.create()).toThrow('The "events" extension needs "values", which no earlier extension provides.');
  });

  it('throws at create without status, and names events and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues })
      .extend(values)
      .extend(events as never);

    expect(() => lacking.create()).toThrow('The "events" extension needs "status", which no earlier extension provides.');
  });

  it('marks the status without validation, also when should.validate asks for it', () => {
    using subject = setup();
    subject.instance.events.change('name', 'a', { should: { validate: true } });

    expect(subject.instance.status.at('name')).toEqual(expect.objectContaining({ dirty: true, touched: true }));
  });
});

describe('change', () => {
  it('writes the value as input, and marks the field dirty and touched', () => {
    using subject = setup();
    const reasons: string[] = [];
    subject.instance.values.onChange((_change, details) => reasons.push(details.reason));
    subject.instance.events.change('address.city', 'Paris');

    expect([reasons, subject.instance.status.at('address.city')]).toEqual([['input'], expect.objectContaining({ dirty: true, touched: true })]);
  });

  it('leaves dirty and touched off when should says so', () => {
    using subject = setup();
    subject.instance.events.change('name', 'a', { should: { dirty: false, touch: false } });

    expect([subject.instance.values.get('name'), subject.instance.status.at('name')]).toEqual([
      'a',
      expect.objectContaining({ dirty: false, touched: false }),
    ]);
  });

  it('marks nothing for a refused change', () => {
    using subject = setup();
    subject.instance.values.intercept((_change, details) => details.cancel());
    subject.instance.events.change('name', 'a');

    expect(subject.instance.status.at('name').dirty).toBe(false);
  });
});

describe('focus and blur', () => {
  it('drive the registered element, and mark touched and blurred', () => {
    using subject = setup();
    const calls: string[] = [];
    subject.instance.events.register('name')(elementOf(calls));
    subject.instance.events.focus('name');
    subject.instance.events.blur('name');

    expect([calls, subject.instance.status.at('name')]).toEqual([['focus', 'blur'], expect.objectContaining({ touched: true, blurred: true })]);
  });

  it('validate once when the DOM event of the element calls the event again', () => {
    const validate = vi.fn((value: unknown) => ({ value: value as never }));
    const counting = { '~standard': { version: 1 as const, vendor: 'oxform-test', validate } };
    using subject = setup({ focus: counting, blur: counting });
    // As in a browser: moving the element fires its DOM event, and the slot handler calls the event again.
    const element = { focus: () => subject.instance.events.focus('name'), blur: () => subject.instance.events.blur('name') };
    subject.instance.events.register('name')(element as unknown as HTMLElement);
    subject.instance.events.focus('name');
    subject.instance.events.blur('name');

    expect(validate.mock.calls.length).toBe(2);
  });

  it('mark a field without an element', () => {
    using subject = setup();
    subject.instance.events.blur('address.city');

    expect(subject.instance.status.at('address.city').blurred).toBe(true);
  });
});

describe('requested validation', () => {
  it('runs for a change when a check has a change validator', async () => {
    using subject = setup({ change: reporting({ message: 'Bad', path: ['name'] }) });
    const ran = new Promise(resolve => subject.validation.onRun(resolve));
    subject.instance.events.change('name', 'a');
    await ran;

    expect(subject.error.at('name')[0]).toEqual(expect.objectContaining({ message: 'Bad', type: 'change' }));
  });

  it('is not requested when no check has a validator for the event', () => {
    using subject = setup({ blur: reporting() });
    subject.instance.events.change('name', 'a');
    subject.instance.events.focus('name');

    expect(subject.validation.validating).toBe(false);
  });

  it('is skipped when should.validate is false', () => {
    using subject = setup({ change: reporting({ message: 'Bad', path: ['name'] }) });
    subject.instance.events.change('name', 'a', { should: { validate: false } });

    expect(subject.validation.validating).toBe(false);
  });

  it('runs when should.validate is true without a validator', () => {
    using subject = setup({});
    subject.instance.events.focus('name', { should: { validate: true } });

    expect(subject.validation.validating).toBe(true);
  });

  it('runs the blur and the focus validators for those events, on the path', async () => {
    using subject = setup({
      blur: reporting({ message: 'blur', path: ['name'] }),
      focus: reporting({ message: 'focus', path: ['address', 'city'] }),
    });
    let count = 0;
    const ran = new Promise(resolve => subject.validation.onRun(() => ++count === 2 && resolve(undefined)));
    subject.instance.events.blur('name');
    subject.instance.events.focus('address.city');
    await ran;

    expect([subject.error.at('name')[0]?.type, subject.error.at('address.city')[0]?.type]).toEqual(['blur', 'focus']);
  });

  it('lets the operation return before the validation settles', () => {
    using subject = setup({ change: reporting() });
    subject.instance.events.change('name', 'a');

    expect([subject.instance.values.get('name'), subject.validation.validating]).toEqual(['a', true]);
  });
});

describe('register and unregister', () => {
  it('give the element to the field ref', () => {
    using subject = setup();
    const element = elementOf([]);
    subject.instance.events.register('name')(element);

    expect(eventsInternals(subject.instance.events).ref('name')).toBe(element);
  });

  it('keep the element for a null ref', () => {
    using subject = setup();
    const element = elementOf([]);
    subject.instance.events.register('name')(element);
    subject.instance.events.register('name')(null);

    expect(eventsInternals(subject.instance.events).ref('name')).toBe(element);
  });

  it('forget the element at unregister, and keep the value', () => {
    using subject = setup();
    subject.instance.events.change('name', 'a');
    subject.instance.events.register('name')(elementOf([]));
    subject.instance.events.unregister('name');

    expect([eventsInternals(subject.instance.events).ref('name'), subject.instance.values.get('name')]).toEqual([null, 'a']);
  });

  it('forget every element when the refs are cleared', () => {
    using subject = setup();
    subject.instance.events.register('name')(elementOf([]));
    eventsInternals(subject.instance.events).clearRefs();

    expect(eventsInternals(subject.instance.events).ref('name')).toBeNull();
  });
});
