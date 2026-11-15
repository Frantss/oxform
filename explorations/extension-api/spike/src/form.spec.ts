import { describe, expect, it, vi } from 'vitest';
import type { Extendable, Form, Needs, Self } from './api';
import { defineExtension, defineForm, option } from './form';
import { schemaOf } from './test-helpers';
import { values } from './values';

type Login = { email: string; password: string };
const defaultValues: Login = { email: '', password: '' };

const login = defineForm({ schema: schemaOf<Login>(), defaultValues, id: 'login' }).extend(values);

describe('defineForm', () => {
  it('creates an instance whose values come from defaultValues', () => {
    const instance = login.create();

    expect(instance.values.get()).toEqual(defaultValues);
    expect(instance.id).toBe('login');
    expect(instance.store.state).toEqual({ values: defaultValues });
  });

  it('types values from the schema', () => {
    const instance = login.create();

    instance.values.set('email', 'a@b.c');
    // @ts-expect-error unknown path
    instance.values.set('nope', 'x');
    // @ts-expect-error wrong value type
    instance.values.set('email', 1);
  });

  it('rejects defaultValues that do not match the schema', () => {
    // @ts-expect-error defaultValues do not match the schema
    defineForm({ schema: schemaOf<Login>(), defaultValues: { email: 1 } });
  });

  it('gives each instance its own state', () => {
    const first = login.create();
    const second = login.create();

    first.values.set('email', 'a');
    expect(second.values.get('email')).toBe('');
  });

  it('lets instance options override the form options (later wins)', () => {
    const instance = login.create({ defaultValues: { email: 'x', password: '' }, id: 'other' });

    expect(instance.values.get('email')).toBe('x');
    expect(instance.id).toBe('other');
  });

  it('names the form, and lists the kind of every option for an adapter', () => {
    const form = defineForm({ name: 'login', schema: schemaOf<Login>(), defaultValues }).extend(values);

    expect(form.name).toBe('login');
    expect(form.optionKinds).toEqual({ id: 'id', schema: 'value', defaultValues: 'value' });
    expect(defineForm({ schema: schemaOf<Login>(), defaultValues }).name).toBe('form');
  });
});

describe('extend', () => {
  const clear = <V extends Login>(form: Extendable<V, Needs<V, 'values'>>) =>
    defineExtension(form, {
      name: 'clear',
      api: (_ctx, { values }) => ({ clear: () => values.set('email' as never, '' as never) }),
    });

  it('merges the extension api with the api before it', () => {
    const instance = login.extend(clear).create({ defaultValues: { email: 'a', password: '' } });

    instance.clear();
    expect(instance.values.get('email')).toBe('');
    expect(instance.values).toBeDefined();
  });

  it('returns a new form and leaves the base form unchanged', () => {
    const extended = login.extend(clear);

    expect(extended).not.toBe(login);
    expect('clear' in login.create()).toBe(false);
    expect('clear' in extended.create()).toBe(true);
  });

  it('runs the extensions in call order, each with the api of the earlier ones', () => {
    const order: string[] = [];
    const named = (name: string) => (form: Extendable<Login>) =>
      defineExtension(form, {
        name,
        api: (_ctx, deps) => (order.push(`${name}:${Object.keys(deps).join(',')}`), { [name]: true }),
      });

    defineForm({ schema: schemaOf<Login>(), defaultValues }).extend(values).extend(named('a')).extend(named('b')).create();

    expect(order).toEqual(['a:values', 'b:values,a']);
  });

  it('applies a preset: a function from form to form', () => {
    const preset = <V, Api extends {}, Options, State extends {}, Slots, Fields>(form: Form<V, Api, Options, State, Slots, Fields>) =>
      form.extend(values);

    const instance = defineForm({ schema: schemaOf<Login>(), defaultValues }).extend(preset).create();

    expect(instance.values.get()).toEqual(defaultValues);
  });

  it('applies a preset to a form that already has extensions, and an extension after it', () => {
    const preset = <V, Api extends {}, Options, State extends {}, Slots, Fields>(form: Form<V, Api, Options, State, Slots, Fields>) =>
      form.extend(values);
    const marker = <V>(form: Extendable<V, Needs<V, 'values'>>) => defineExtension(form, { name: 'marker', api: () => ({ marker: 1 }) });

    const instance = defineForm({ schema: schemaOf<Login>(), defaultValues }).extend(preset).extend(marker).create();

    expect(instance.marker).toBe(1);
  });
});

describe('configure', () => {
  /** Adds the options `limit` (a number) and `onDone` (an action that receives the values and the form). */
  const limited = <V extends Login>(form: Extendable<V, Needs<V, 'values'>>) =>
    defineExtension(form, {
      name: 'limited',
      options: { limit: option.number(), onDone: option.action<(values: V, form: Self) => unknown>() },
      api: (ctx, { values }) => ({
        limit: () => ctx.options().limit,
        done: () => ctx.options().onDone?.(values.get(), ctx.instance()),
      }),
    });
  const base = login.extend(limited);

  it('gives every instance the configured options', () => {
    const instance = base.configure({ limit: 3 }).create();

    expect(instance.limit()).toBe(3);
  });

  it('lets create options win over configured ones, and keeps the configured ones create does not mention', () => {
    const onDone = vi.fn();
    const instance = base.configure({ limit: 3, onDone }).create({ limit: 9 });

    expect(instance.limit()).toBe(9);
    instance.done();
    expect(onDone).toHaveBeenCalledWith(defaultValues, instance);
  });

  it('merges successive calls, and a later call wins', () => {
    const instance = base.configure({ limit: 1, id: 'one' }).configure({ limit: 2 }).create();

    expect(instance.limit()).toBe(2);
    expect(instance.id).toBe('one');
  });

  it('configures the options the form was defined with, such as defaultValues', () => {
    const instance = base.configure({ defaultValues: { email: 'a', password: '' } }).create();

    expect(instance.values.get('email')).toBe('a');
  });

  it('returns a new form and leaves the base form unchanged', () => {
    const configured = base.configure({ limit: 3 });

    expect(configured).not.toBe(base);
    expect(base.create().limit()).toBeUndefined();
    expect(configured.create().limit()).toBe(3);
  });

  it('keeps the configured options through a later extend, and through a preset', () => {
    const marker = <V>(form: Extendable<V>) => defineExtension(form, { name: 'marker', api: () => ({ marker: 1 }) });
    const preset = <V, Api extends {}, Options, State extends {}, Slots, Fields>(form: Form<V, Api, Options, State, Slots, Fields>) =>
      form.extend(marker);

    const extended = base.configure({ limit: 3 }).extend(marker).create();
    const presetted = base.configure({ limit: 4 }).extend(preset).create();

    expect(extended.limit()).toBe(3);
    expect(presetted.limit()).toBe(4);
  });

  it('types the options by the values and the extensions applied so far', () => {
    base.configure({ onDone: (values, form) => void [values.email, form.limit()] });
    // @ts-expect-error limit is a number
    base.configure({ limit: 'many' });
    // @ts-expect-error an option nobody declares
    base.configure({ nope: 1 });
    // @ts-expect-error `limit` belongs to an extension that is not applied yet
    login.configure({ limit: 3 });
  });

  it('keeps the option kinds of the form, for an adapter', () => {
    expect(base.configure({ limit: 3 }).optionKinds).toEqual({
      id: 'id',
      schema: 'value',
      defaultValues: 'value',
      limit: 'number',
      onDone: 'action',
    });
  });
});

describe('duplicates', () => {
  const declaring = (name: string, options: Record<string, ReturnType<typeof option.number>>) => (form: Extendable<Login>) =>
    defineExtension(form, { name, options, api: () => ({}) });
  const base = defineForm({ schema: schemaOf<Login>(), defaultValues });

  it('throws at extend when two extensions declare an option, and names both', () => {
    const withLimit = base.extend(declaring('first', { limit: option.number() }));

    expect(() => withLimit.extend(declaring('second', { limit: option.number() }))).toThrow(
      'The "second" extension declares the option "limit", which "first" already declares.',
    );
  });

  it('throws at extend when an extension declares an option the form has', () => {
    expect(() => base.extend(declaring('bad', { id: option.number() }))).toThrow('The "bad" extension declares the option "id", which the form has.');
  });

  it('throws at create when two extensions return the same api key, and names both', () => {
    const returning = (name: string) => (form: Extendable<Login>) => defineExtension(form, { name, api: () => ({ shared: name }) });
    const form = base.extend(returning('first')).extend(returning('second'));

    expect(() => form.create()).toThrow('The "second" extension returns "shared" from api, which "first" already returns.');
  });

  it('throws at create when an extension returns a key that the instance owns', () => {
    const form = base.extend(form => defineExtension(form, { name: 'bad', api: () => ({ store: 1 }) }));

    expect(() => form.create()).toThrow('The "bad" extension returns "store" from api, which the instance has.');
  });

  it('throws at create when two extensions declare a state key', () => {
    const stating = (name: string) => (form: Extendable<Login>) => defineExtension(form, { name, state: () => ({ shared: 1 }), api: () => ({}) });

    expect(() => base.extend(stating('first')).extend(stating('second')).create()).toThrow(
      'The "second" extension declares the state key "shared", which "first" already declares.',
    );
  });
});

describe('options', () => {
  it('records the kind of every extension option', () => {
    const form = defineForm({ schema: schemaOf<Login>(), defaultValues }).extend(<V>(form: Extendable<V>) =>
      defineExtension(form, {
        name: 'kinds',
        options: {
          delay: option.number(),
          label: option.string(),
          onDone: option.action<() => void>(),
          tags: option.list(),
        },
        api: () => ({}),
      }),
    );

    expect(form.optionKinds).toMatchObject({ delay: 'number', label: 'string', onDone: 'action', tags: 'list' });
  });

  it('gives an extension the merged options, and its state factory too', () => {
    const seen: unknown[] = [];
    const form = defineForm({ schema: schemaOf<Login>(), defaultValues }).extend(<V>(form: Extendable<V>) =>
      defineExtension(form, {
        name: 'seeing',
        options: { limit: option.number() },
        state: options => (seen.push(options.limit), { limit: options.limit ?? 0 }),
        api: ctx => ({ limit: () => ctx.options().limit }),
      }),
    );

    const instance = form.create({ limit: 3 });

    expect(seen).toEqual([3]);
    expect(instance.limit()).toBe(3);
    expect(instance.store.state.limit).toBe(3);
  });

  it('resolves `Self` to the instance in an option callback', () => {
    const received: unknown[] = [];
    const form = defineForm({ schema: schemaOf<Login>(), defaultValues })
      .extend(values)
      .extend(<V>(form: Extendable<V>) =>
        defineExtension(form, {
          name: 'callback',
          options: { onDone: option.action<(form: import('./api').Self) => void>() },
          api: ctx => ({ done: () => ctx.options().onDone?.(ctx.instance()) }),
        }),
      );

    const instance = form.create({ onDone: self => received.push(self) });
    instance.done();

    expect(received).toEqual([instance]);
    form.create({ onDone: self => void self.values.get() });
  });
});

describe('destroy', () => {
  it('runs cleanups registered through the context', () => {
    const cleanup = vi.fn();
    const instance = login.extend(form => defineExtension(form, { name: 'cleanup', api: ctx => (ctx.onDestroy(cleanup), {}) })).create();

    instance.destroy();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});

describe('scopes', () => {
  const MOUNT = Symbol.for('oxform.scope.mount');

  it('places a scope into the options of every instance, and lets an option override its default', () => {
    const mount = vi.fn((options: Record<string, unknown>, mountPath: string) => ({
      ...options,
      defaultValues: { [mountPath]: { city: 'x' }, ...(options.defaultValues as object) },
    }));
    const scope = { schema: schemaOf<{ city: string }>(), defaultValues: { city: 'x' }, [MOUNT]: mount };
    const form = defineForm({ schema: schemaOf<{ name: string }>(), defaultValues: { name: '' }, scopes: { home: scope } }).extend(values);

    const instance = form.create();

    // The hook also gets the layers of options (`defineForm`, `configure`, `create`), lowest priority first.
    expect(mount).toHaveBeenCalledWith(expect.objectContaining({ defaultValues: { name: '' } }), 'home', [
      expect.objectContaining({ defaultValues: { name: '' } }),
      {},
      {},
    ]);
    expect(instance.values.get()).toEqual({ home: { city: 'x' }, name: '' });
    expect(instance.values.get('home.city')).toBe('x');
    expect(form.create({ defaultValues: { name: 'n', home: { city: 'y' } } }).values.get('home.city')).toBe('y');
  });
});
