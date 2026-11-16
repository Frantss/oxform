import {
  defineExtension,
  defineForm,
  defineSlots,
  option,
  type AnyForm,
  type ApiOf,
  type BaseOptions,
  type Extendable,
  type Extension,
  type Form,
  type FormContext,
  type Instance,
  type InstanceOf,
  type OptionDescriptor,
  type OptionDescriptors,
  type OptionKind,
  type OptionsFrom,
  type OptionsOf,
  type Self,
  type SlotDefinition,
  type StateOf,
  type StateSlice,
  type ValuesOf,
} from '@oxform/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expectTypeOf, it } from 'vite-plus/test';

type Login = { email: string; password: string };

const schema = {} as StandardSchemaV1<Login>;
const login = defineForm({ schema, defaultValues: { email: '', password: '' } });

/** Accepts a value of the given type. A negative case calls it with a value of another type. */
const accepts = <Type>(value: Type): Type => value;

/** The `values` state key, and a `values` api that reads it. */
const store = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'store',
    state: options => ({ values: options.defaultValues }),
    api: context => ({ values: { get: () => context.state.values.get() } }),
  });

/** The option `onDone`, an action that gets the instance. */
const done = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'done',
    options: { limit: option.number(), onDone: option.action<(form: Self) => void>() },
    api: () => ({ done: () => {} }),
  });

/** Needs the `values` api. */
const needsValues = <Values>(form: Extendable<Values, { values: { get(): Values } }>) =>
  defineExtension(form, { name: 'needsValues', needs: { api: ['values'] }, api: () => ({}) });

const form = login.extend(store).extend(done);

describe('defineForm, Form', () => {
  it('types the values from the schema', () => {
    expectTypeOf(login).toEqualTypeOf<Form<Login>>();
  });

  it('rejects defaultValues that do not match the schema', () => {
    // @ts-expect-error The email is not a string.
    defineForm({ schema, defaultValues: { email: 1, password: '' } });
  });

  it('rejects a form with no schema', () => {
    // @ts-expect-error The schema is missing.
    defineForm({ defaultValues: { email: '' } });
  });
});

describe('Form', () => {
  it('collects the api of each extension', () => {
    expectTypeOf(form.create().values.get()).toEqualTypeOf<Login>();
  });

  it('applies a preset', () => {
    const preset = <V, Api extends {}, Options, State extends {}, Slots, Fields>(
      base: Form<V, Api, Options, State, Slots, Fields>,
    ) => base.extend(store);

    expectTypeOf(login.extend(preset).create().values.get()).toEqualTypeOf<Login>();
  });

  it('rejects an extension whose need the form does not meet', () => {
    // @ts-expect-error The form has no values api.
    login.extend(needsValues);
  });

  it('accepts an extension whose need an earlier extension meets', () => {
    expectTypeOf(login.extend(store).extend(needsValues).create()).toHaveProperty('values');
  });

  it('types configure with the options of the extensions so far', () => {
    expectTypeOf<Parameters<typeof form.configure>[0]>().toHaveProperty('limit').toEqualTypeOf<number | undefined>();
  });

  it('rejects an option of an extension that is not applied yet', () => {
    // @ts-expect-error `limit` belongs to `done`, which comes later.
    login.configure({ limit: 1 });
  });

  it('rejects an option of the wrong type at create', () => {
    // @ts-expect-error `limit` is a number.
    form.create({ limit: 'many' });
  });

  it('resolves Self to the instance in an option callback', () => {
    form.create({ onDone: instance => expectTypeOf(instance).toEqualTypeOf<InstanceOf<typeof form>>() });
  });
});

describe('AnyForm', () => {
  it('accepts every form', () => {
    expectTypeOf(form).toExtend<AnyForm>();
  });

  it('rejects an object that is not a form', () => {
    // @ts-expect-error An object with a name is not a form.
    accepts<AnyForm>({ name: 'form' });
  });
});

describe('Instance', () => {
  it('has the api, the id, the store and destroy', () => {
    expectTypeOf<Instance<Login, { a: 1 }, { b: 2 }>>().toEqualTypeOf<
      { a: 1 } & {
        readonly id: string;
        readonly store: import('@tanstack/store').ReadonlyStore<{ b: 2 }>;
        destroy(): void;
      }
    >();
  });

  it('has a read-only id', () => {
    const instance = form.create();
    // @ts-expect-error The id is read-only.
    instance.id = 'other';
  });
});

describe('BaseOptions', () => {
  it('holds the id, the schema and the default values', () => {
    expectTypeOf<keyof BaseOptions<Login>>().toEqualTypeOf<'id' | 'schema' | 'defaultValues'>();
  });

  it('needs the default values', () => {
    // @ts-expect-error The default values are missing.
    accepts<BaseOptions<Login>>({ schema });
  });
});

describe('Self', () => {
  it('is replaced by the instance in the options of create', () => {
    expectTypeOf<OptionsOf<typeof form>['onDone']>().toEqualTypeOf<(instance: InstanceOf<typeof form>) => void>();
  });

  it('is not the instance in an extension', () => {
    // @ts-expect-error An instance is not a Self.
    accepts<Self>(form.create());
  });
});

describe('option, OptionDescriptor, OptionKind', () => {
  it('carries the kind and the type of an option', () => {
    expectTypeOf(option.string<'a' | 'b'>()).toEqualTypeOf<OptionDescriptor<'a' | 'b', 'string'>>();
  });

  it('records one of the known kinds', () => {
    expectTypeOf(option.number().kind).toEqualTypeOf<OptionKind & 'number'>();
  });

  it('rejects a string option of another type', () => {
    // @ts-expect-error A string option has a string type.
    option.string<number>();
  });

  it('rejects an unknown kind', () => {
    // @ts-expect-error There is no date kind.
    accepts<OptionKind>('date');
  });

  it('rejects a descriptor of another kind', () => {
    // @ts-expect-error A number descriptor is not a string descriptor.
    accepts<OptionDescriptor<string, 'string'>>(option.number());
  });
});

describe('OptionDescriptors, OptionsFrom', () => {
  it('types a record of descriptors as optional options', () => {
    const descriptors = { limit: option.number() } satisfies OptionDescriptors;

    expectTypeOf<OptionsFrom<typeof descriptors>>().toEqualTypeOf<{ readonly limit?: number }>();
  });

  it('rejects a record value that is not a descriptor', () => {
    // @ts-expect-error A number is not a descriptor.
    accepts<OptionDescriptors>({ limit: 1 });
  });

  it('rejects an option of the wrong type', () => {
    // @ts-expect-error `limit` is a number.
    accepts<OptionsFrom<{ limit: OptionDescriptor<number> }>>({ limit: 'many' });
  });
});

describe('ValuesOf, ApiOf, StateOf, OptionsOf, InstanceOf', () => {
  it('reads the types of a form back', () => {
    expectTypeOf<
      [ValuesOf<typeof form>, ReturnType<ApiOf<typeof form>['values']['get']>, StateOf<typeof form>]
    >().toEqualTypeOf<[Login, Login, { values: Login }]>();
  });

  it('reads the options and the instance', () => {
    expectTypeOf<OptionsOf<typeof form>['limit']>().toEqualTypeOf<number>();
    expectTypeOf<InstanceOf<typeof form>>().toEqualTypeOf<ReturnType<typeof form.create>>();
  });

  it('gives never for a type that is not a form', () => {
    expectTypeOf<
      [ValuesOf<string>, ApiOf<string>, StateOf<string>, OptionsOf<string>, InstanceOf<string>]
    >().toEqualTypeOf<[never, never, never, never, never]>();
  });

  it('rejects other values for the values of a form', () => {
    // @ts-expect-error The values of the form are a Login.
    accepts<ValuesOf<typeof form>>({ email: 1 });
    // @ts-expect-error The api of the form has no submit.
    accepts<keyof ApiOf<typeof form>>('submit');
    // @ts-expect-error The state of the form has no status.
    accepts<keyof StateOf<typeof form>>('status');
    // @ts-expect-error `limit` is a number.
    accepts<OptionsOf<typeof form>>({ limit: 'many' });
    // @ts-expect-error A form is not an instance.
    accepts<InstanceOf<typeof form>>(form);
  });
});

describe('defineExtension, Extension, Extendable', () => {
  it('returns the types that the extension adds', () => {
    expectTypeOf(store(login)).toEqualTypeOf<
      Extension<OptionsFrom<{}>, { values: Login }, { values: { get: () => Login } }>
    >();
  });

  it('needs an api', () => {
    // @ts-expect-error The definition has no api.
    defineExtension(login, { name: 'empty' });
  });

  it('rejects a form that does not provide the needs', () => {
    // @ts-expect-error The form has no values api.
    accepts<Extendable<Login, { values: unknown }>>(login);
  });

  it('rejects a value that is not an extension', () => {
    // @ts-expect-error A definition object is not an extension.
    accepts<Extension>({ name: 'store' });
  });
});

describe('FormContext, StateSlice', () => {
  it('gives a slice per state key, typed by the state', () => {
    expectTypeOf<FormContext<unknown, { count: number }>['state']['count']>().toEqualTypeOf<StateSlice<number>>();
  });

  it('rejects a value of another type in a slice', () => {
    const slice = {} as StateSlice<number>;
    // @ts-expect-error The slice holds a number.
    slice.set('one');
  });

  it('has no slice for a key that the state does not have', () => {
    const context = {} as FormContext<unknown, { count: number }>;
    // @ts-expect-error The state has no name.
    accepts(context.state.name);
  });
});

describe('defineSlots, SlotDefinition', () => {
  it('makes a slot group with a name', () => {
    expectTypeOf(defineSlots({ name: 'x' }, () => ({}))).toEqualTypeOf<SlotDefinition>();
  });

  it('needs a build function', () => {
    // @ts-expect-error The build function is missing.
    defineSlots({ name: 'x' });
  });
});
