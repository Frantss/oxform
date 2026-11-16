import { describe, expect, it, vi } from 'vite-plus/test';
import { named, schemaOf } from '../../tests/helpers';
import { getAt, setAt } from '#internal/paths';
import { contextInternals } from './context';
import { defineExtension, defineForm, defineSlots, on, option, optionKindsOf, slotsOf } from './form';
import type { Path, PathValue } from './path-types';
import type { Extendable, Form, Needs, Self } from './types';

type Login = { email: string; password: string };

/** A form over `Login`. Each instance that the case creates is destroyed when the case ends. */
const setup = (init: { id?: string; name?: string } = {}) => {
  const created: { destroy(): void }[] = [];
  const form = defineForm({ schema: schemaOf<Login>(), defaultValues: { email: '', password: '' }, ...init });

  return {
    form,
    /** Creates an instance of `form`, and destroys it at the end of the case. */
    create<Instance extends { destroy(): void }>(make: () => Instance): Instance {
      const instance = make();
      created.push(instance);
      return instance;
    },
    [Symbol.dispose]: () => created.forEach(instance => instance.destroy()),
  };
};

/** A stand-in for `values`: the `values` state key, and an api that reads and writes it. */
const store = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'store',
    state: options => ({ values: options.defaultValues }),
    api: context => ({
      values: {
        get: () => context.state.values.get(),
        set: (next: Values) => context.state.values.set(next),
      },
    }),
  });

/** Adds the options `limit` (a number) and `onDone` (an action that gets the instance). */
const limited = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'limited',
    options: { limit: option.number(), onDone: option.action<(form: Self) => void>() },
    api: context => ({
      limit: () => context.options().limit,
      done: () => context.options().onDone?.(context.instance()),
    }),
  });

/** An extension that returns `key` from its api. */
const returning = (name: string, key: string) => (form: Extendable<unknown>) => defineExtension(form, { name, api: () => ({ [key]: name }) });

/** An extension that declares the state key `key`. */
const declaring = (name: string, key: string) => (form: Extendable<unknown>) =>
  defineExtension(form, { name, state: () => ({ [key]: 1 }), api: () => ({}) });

/** An extension that declares the given options. */
const withOptions = (name: string, options: Record<string, ReturnType<typeof option.number>>) => (form: Extendable<unknown>) =>
  defineExtension(form, { name, options, api: () => ({}) });

/**
 * An extension that needs the api names and the state keys it is given, and records when its api runs. Its type
 * states no need, as for a JavaScript caller, so only the runtime check sees the needs.
 */
const needing =
  (needs: { api?: string[]; state?: string[] }, ran = vi.fn()) =>
  (form: Extendable<unknown>) =>
    defineExtension(form, { name: 'needing', needs: needs as never, api: () => (ran(), {}) });

/** The message of the error that `run` throws, or "returned". */
const attempt = (run: () => unknown) => {
  try {
    run();
    return 'returned';
  } catch (error) {
    return (error as Error).message;
  }
};

/** A preset: a function from form to form. */
const preset = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(form: Form<Values, Api, Options, State, Slots, Fields>) =>
  form.extend(store);

/** A stand-in for `handles`: the `values` state, and a `field(path)` api that carries the field members. */
const fielded = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'fielded',
    state: options => ({ values: options.defaultValues }),
    api: context => ({
      field: <At extends Path<Values>>(path: At) =>
        contextInternals(context).decorateField(
          {
            get: () => getAt(context.state.values.get(), path) as PathValue<Values, At>,
            change: (next: PathValue<Values, At>) => context.state.values.set(values => setAt(values, path, next)),
          },
          path,
        ),
    }),
  });

const isString = (value: unknown): value is string => typeof value === 'string';

/** `mask` on string fields: it fills each `#` of a pattern with the next character of the value. */
const mask = <Values>(form: Extendable<Values, Needs<Values, 'field'>>) =>
  defineExtension(form, {
    name: 'mask',
    needs: { api: ['field'] },
    api: () => ({}),
    fields: on(isString)(field => ({
      mask: (pattern: string) =>
        field
          .get()
          .split('')
          .reduce((masked, character) => masked.replace('#', character), pattern),
    })),
  });

/** `upper` on every field. */
const upper = <Values>(form: Extendable<Values, Needs<Values, 'field'>>) =>
  defineExtension(form, {
    name: 'upper',
    needs: { api: ['field'] },
    api: () => ({}),
    fields: on()(field => ({ upper: () => String(field.get()).toUpperCase() })),
  });

type PingApi = { intercept(step: (value: string) => string): void; run(value: string): string };

/** An api with an extension hook: `intercept` steps run in the order they were added. */
const pinger = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'pinger',
    api: () => {
      const steps: ((value: string) => string)[] = [];
      const ping: PingApi = {
        intercept: step => void steps.push(step),
        run: value => steps.reduce((current, step) => step(current), value),
      };
      return { ping };
    },
  });

/** Adds `suffix` to each ping, through the extension hook of `pinger`. */
const suffix =
  (name: string) =>
  <Values>(form: Extendable<Values, { ping: PingApi }>) =>
    defineExtension(form, {
      name,
      needs: { api: ['ping'] },
      api: (_context, { ping }) => (ping.intercept(value => value + name), {}),
    });

describe('defineForm', () => {
  it('makes instances that take their values from defaultValues', () => {
    using subject = setup();
    const instance = subject.create(() => subject.form.extend(store).create());

    expect(instance.values.get()).toEqual({ email: '', password: '' });
  });

  it('gives each instance its own state', () => {
    using subject = setup();
    const form = subject.form.extend(store);
    const first = subject.create(() => form.create());
    const second = subject.create(() => form.create());
    first.values.set({ email: 'a', password: '' });

    expect(second.values.get()).toEqual({ email: '', password: '' });
  });

  it('names the form, with "form" as the default', () => {
    using subject = setup({ name: 'login' });

    expect([subject.form.name, defineForm({ schema: schemaOf<Login>(), defaultValues: {} as Login }).name]).toEqual(['login', 'form']);
  });

  it('lists the kind of every option, the base options first', () => {
    using subject = setup();

    expect(optionKindsOf(subject.form.extend(limited))).toEqual({
      id: 'id',
      schema: 'value',
      defaultValues: 'value',
      limit: 'number',
      onDone: 'action',
    });
  });

  it('starts no timer and calls no method at creation', () => {
    using subject = setup();
    vi.useFakeTimers();
    const done = vi.fn();
    subject.create(() => subject.form.extend(limited).create({ onDone: done }));
    const timers = vi.getTimerCount();
    vi.useRealTimers();

    expect([timers, done.mock.calls.length]).toEqual([0, 0]);
  });

  it('accepts an option that no extension declares', () => {
    using subject = setup();
    const create = () => subject.create(() => subject.form.create({ unknown: 1 } as never));

    expect(create).not.toThrow();
  });
});

describe('form.create', () => {
  it('takes the options of create over configure over defineForm', () => {
    using subject = setup({ id: 'defined' });
    const configured = subject.form.extend(limited).configure({ id: 'configured', limit: 1 });
    const instances = [configured.create(), configured.create({ id: 'created' })].map(instance => subject.create(() => instance));

    expect(instances.map(instance => [instance.id, instance.limit()])).toEqual([
      ['configured', 1],
      ['created', 1],
    ]);
  });

  it('takes the id of defineForm', () => {
    using subject = setup({ id: 'login' });

    expect(subject.create(() => subject.form.create()).id).toBe('login');
  });

  it('gives each instance without an id its own id from a counter', () => {
    using subject = setup();
    const ids = [subject.form.create(), subject.form.create()].map(instance => subject.create(() => instance).id);

    expect([ids.every(id => /^form-\d+$/u.test(id)), new Set(ids).size]).toEqual([true, 2]);
  });

  it('holds the state of every extension in the store', () => {
    using subject = setup();
    const instance = subject.create(() => subject.form.extend(store).extend(declaring('count', 'count')).create());

    expect(instance.store.state).toEqual({ values: { email: '', password: '' }, count: 1 });
  });

  it('runs every cleanup once at destroy', () => {
    using subject = setup();
    const cleanup = vi.fn();
    const instance = subject.form
      .extend(form => defineExtension(form, { name: 'cleanup', api: context => (context.onDestroy(cleanup), {}) }))
      .create();
    instance.destroy();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('runs the cleanups of the earlier extensions when a later one throws', () => {
    using subject = setup();
    const cleanup = vi.fn();
    const form = subject.form
      .extend(form => defineExtension(form, { name: 'cleanup', api: context => (context.onDestroy(cleanup), {}) }))
      .extend(needing({ api: ['missing'] }));

    expect([attempt(() => form.create()), cleanup.mock.calls.length]).toEqual([
      'The "needing" extension needs "missing", which no earlier extension provides.',
      1,
    ]);
  });
});

describe('form.extend', () => {
  it('merges the api of an extension with the api before it', () => {
    using subject = setup();
    const instance = subject.create(() => subject.form.extend(store).extend(returning('marker', 'marker')).create());

    expect(Object.keys(instance)).toEqual(['values', 'marker', 'id', 'store', 'destroy']);
  });

  it('runs the extensions in call order, each with the api of the earlier ones', () => {
    using subject = setup();
    const seen: string[] = [];
    const recording = (name: string) => (form: Extendable<unknown>) =>
      defineExtension(form, { name, api: (_context, deps) => (seen.push(`${name}:${Object.keys(deps).join()}`), { [name]: 1 }) });
    subject.create(() => subject.form.extend(recording('a')).extend(recording('b')).create());

    expect(seen).toEqual(['a:', 'b:a']);
  });

  it('returns a new form and leaves the base form unchanged', () => {
    using subject = setup();
    const extended = subject.form.extend(store);

    expect([extended === subject.form, 'values' in subject.create(() => subject.form.create())]).toEqual([false, false]);
  });

  it('applies a preset', () => {
    using subject = setup();
    const instance = subject.create(() => subject.form.extend(preset).create());

    expect(instance.values.get()).toEqual({ email: '', password: '' });
  });

  it('applies a preset to a form with extensions, and an extension after it', () => {
    using subject = setup();
    const form = subject.form.extend(limited).extend(preset).extend(returning('marker', 'marker'));

    expect(slotsOf(form)).toEqual(['limited', 'store', 'marker']);
  });

  it('throws when two extensions declare an option, and names both', () => {
    using subject = setup();
    const form = subject.form.extend(withOptions('first', { limit: option.number() }));

    expect(() => form.extend(withOptions('second', { limit: option.number() }))).toThrow(
      'The "second" extension declares the option "limit", which "first" already declares.',
    );
  });

  it('throws when an extension declares an option of the form', () => {
    using subject = setup();

    expect(() => subject.form.extend(withOptions('bad', { id: option.number() }))).toThrow(
      'The "bad" extension declares the option "id", which the form has.',
    );
  });

  it('throws at create when two extensions return the same api key, and names both', () => {
    using subject = setup();
    const form = subject.form.extend(returning('first', 'shared')).extend(returning('second', 'shared'));

    expect(() => form.create()).toThrow('The "second" extension returns "shared" from api, which "first" already returns.');
  });

  it('throws at create when an extension returns a key that the instance owns', () => {
    using subject = setup();

    expect(() => subject.form.extend(returning('bad', 'store')).create()).toThrow(
      'The "bad" extension returns "store" from api, which the instance has.',
    );
  });

  it('throws at create when two extensions declare a state key, and names both', () => {
    using subject = setup();
    const form = subject.form.extend(declaring('first', 'shared')).extend(declaring('second', 'shared'));

    expect(() => form.create()).toThrow('The "second" extension declares the state key "shared", which "first" already declares.');
  });

  it('throws at create for a missing api need, before the api of the extension runs', () => {
    using subject = setup();
    const ran = vi.fn();
    const create = () => subject.form.extend(needing({ api: ['values'] }, ran)).create();

    expect([attempt(create), ran.mock.calls.length]).toEqual(['The "needing" extension needs "values", which no earlier extension provides.', 0]);
  });

  it('throws at create for a missing state need, and names the state key', () => {
    using subject = setup();

    expect(() => subject.form.extend(needing({ state: ['values'] })).create()).toThrow(
      'The "needing" extension needs the state key "values", which no earlier extension provides.',
    );
  });

  it('passes the needs that an earlier extension provides', () => {
    using subject = setup();
    const ran = vi.fn();
    subject.create(() =>
      subject.form
        .extend(store)
        .extend(needing({ api: ['values'], state: ['values'] }, ran))
        .create(),
    );

    expect(ran).toHaveBeenCalledOnce();
  });

  it('throws for a need that only a later extension provides', () => {
    using subject = setup();
    const form = subject.form.extend(needing({ api: ['values'] })).extend(store);

    expect(() => form.create()).toThrow('The "needing" extension needs "values", which no earlier extension provides.');
  });
});

describe('defineExtension', () => {
  it('adds an api, an option and a state slice, and gives the merged options to the state factory', () => {
    using subject = setup();
    const counter = <Values>(form: Extendable<Values>) =>
      defineExtension(form, {
        name: 'counter',
        options: { start: option.number() },
        state: options => ({ count: options.start ?? 0 }),
        api: context => ({ count: () => context.state.count.get() }),
      });
    const instance = subject.create(() => subject.form.extend(counter).configure({ start: 1 }).create({ start: 2 }));

    expect([instance.count(), instance.store.state.count]).toEqual([2, 2]);
  });

  it('is inert at creation, starts work in a method and stops it at destroy', () => {
    using subject = setup();
    vi.useFakeTimers();
    const poller = <Values>(form: Extendable<Values>) =>
      defineExtension(form, {
        name: 'poller',
        api: context => {
          let timer: ReturnType<typeof setInterval> | undefined;
          context.onDestroy(() => clearInterval(timer));
          return { start: () => void (timer = setInterval(() => {}, 10)) };
        },
      });
    const instance = subject.form.extend(poller).create();
    const counts = [vi.getTimerCount()];
    instance.start();
    counts.push(vi.getTimerCount());
    instance.destroy();
    counts.push(vi.getTimerCount());
    vi.useRealTimers();

    expect(counts).toEqual([0, 1, 0]);
  });

  it('applies in any order that gives its needs', () => {
    using subject = setup();
    const forms = [subject.form.extend(fielded).extend(mask).extend(upper), subject.form.extend(fielded).extend(upper).extend(mask)];
    const members = forms.map(form => Object.keys(subject.create(() => form.create()).field('email')).sort());

    expect(members).toEqual([
      ['change', 'get', 'mask', 'upper'],
      ['change', 'get', 'mask', 'upper'],
    ]);
  });

  it('runs the extension hooks of several extensions in the order applied', () => {
    using subject = setup();
    const instance = subject.create(() => subject.form.extend(pinger).extend(suffix('a')).extend(suffix('b')).create());

    expect(instance.ping.run('x')).toBe('xab');
  });
});

describe('on', () => {
  it('adds the members to every field handle, and the members read the live value', () => {
    using subject = setup();
    const instance = subject.create(() => subject.form.extend(fielded).extend(mask).create());
    const email = instance.field('email');
    email.change('abc');

    expect([email.mask('#-#'), instance.field('password').mask('#')]).toEqual(['a-b', '#']);
  });

  it('keeps the members of the base handle', () => {
    using subject = setup();
    const email = subject.create(() => subject.form.extend(fielded).extend(mask).create()).field('email');
    email.change('abc');

    expect(email.get()).toBe('abc');
  });

  it('gives no member to a field whose value the guard rejects', () => {
    using subject = setup();
    const form = defineForm({ schema: schemaOf<{ age: number }>(), defaultValues: { age: 1 } });
    const instance = subject.create(() => form.extend(fielded).extend(mask).create());

    expect('mask' in instance.field('age')).toBe(false);
  });

  it('combines the members of several extensions', () => {
    using subject = setup();
    const email = subject.create(() => subject.form.extend(fielded).extend(mask).extend(upper).create()).field('email');
    email.change('ab');

    expect([email.mask('#.#'), email.upper()]).toEqual(['a.b', 'AB']);
  });

  it('fails at create on a form with no field api', () => {
    using subject = setup();
    const loose = <Values>(form: Extendable<Values>) => defineExtension(form, { name: 'loose', api: () => ({}), fields: on()(() => ({})) });

    expect(() => subject.form.extend(loose).create()).toThrow('The "loose" extension adds field members, so the form needs a field(path) api.');
  });
});

describe('form.configure', () => {
  it('gives every instance the configured options', () => {
    using subject = setup();
    const form = subject.form.extend(limited).configure({ limit: 3 });

    expect([form.create(), form.create()].map(instance => subject.create(() => instance).limit())).toEqual([3, 3]);
  });

  it('configures the options of defineForm', () => {
    using subject = setup();
    const form = subject.form.extend(store).configure({ defaultValues: { email: 'a', password: '' } });

    expect(subject.create(() => form.create()).values.get()).toEqual({ email: 'a', password: '' });
  });

  it('merges successive calls, and a later call wins', () => {
    using subject = setup();
    const form = subject.form.extend(limited).configure({ limit: 1, id: 'one' }).configure({ limit: 2 });
    const instance = subject.create(() => form.create());

    expect([instance.id, instance.limit()]).toEqual(['one', 2]);
  });

  it('returns a new form and leaves the options of the base form unchanged', () => {
    using subject = setup();
    const base = subject.form.extend(limited);
    base.configure({ limit: 3 });

    expect(subject.create(() => base.create()).limit()).toBeUndefined();
  });

  it('keeps the configured options through a later extend and a preset', () => {
    using subject = setup();
    const configured = subject.form.extend(limited).configure({ limit: 3 });
    const instances = [configured.extend(returning('marker', 'marker')), configured.extend(preset)].map(form => subject.create(() => form.create()));

    expect(instances.map(instance => instance.limit())).toEqual([3, 3]);
  });
});

describe('option', () => {
  it('records the runtime kind of each descriptor', () => {
    using subject = setup();
    const kinds = Object.entries(option as Record<string, () => { kind: string }>).map(([name, make]) => [name, make().kind]);

    expect([subject.form.name, ...kinds]).toEqual([
      'form',
      ['string', 'string'],
      ['number', 'number'],
      ['boolean', 'boolean'],
      ['list', 'list'],
      ['value', 'value'],
      ['callback', 'callback'],
      ['action', 'action'],
      ['id', 'id'],
      ['key', 'key'],
    ]);
  });

  it('passes the instance where an option callback takes Self', () => {
    using subject = setup();
    const received: unknown[] = [];
    const instance = subject.create(() => subject.form.extend(limited).create({ onDone: form => received.push(form) }));
    instance.done();

    expect(received).toEqual([instance]);
  });
});

describe('optionKindsOf', () => {
  it('refuses an object that defineForm did not make', () => {
    using subject = setup();

    expect(() => optionKindsOf({ ...subject.form })).toThrow('This function expects a form made by defineForm.');
  });
});

describe('slotsOf', () => {
  it('lists the extensions of a form in order', () => {
    using subject = setup();

    expect(slotsOf(subject.form.extend(named('first')).extend(named('second')))).toEqual(['first', 'second']);
  });
});

describe('defineSlots', () => {
  it('records the name of the group beside its slots', () => {
    using subject = setup();
    const group = defineSlots({ name: 'group' }, () => ({ form: subject.form }));

    expect(group).toEqual({ name: 'group', slots: { form: subject.form } });
  });
});
