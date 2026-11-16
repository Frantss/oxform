import {
  createEffect,
  defineExtension,
  defineForm,
  defineScope,
  defineSlots,
  on,
  option,
  slots,
  type AnyForm,
  type ApiOf,
  type Attributes,
  type BaseOptions,
  type BuiltInApis,
  type ElementTag,
  type Extendable,
  type Extension,
  type FieldMembers,
  type FieldOf,
  type FieldsOf,
  type Form,
  type FormContext,
  type Instance,
  type InstanceOf,
  type KeyProp,
  type Needs,
  type OptionDescriptor,
  type OptionDescriptors,
  type OptionKind,
  type OptionsFrom,
  type OptionsOf,
  type PartDomProps,
  type PartEventContext,
  type PartHandle,
  type PartSpec,
  type PartsOf,
  type PropKind,
  type PropsOf,
  type ScopeDefinition,
  type ScopedValues,
  type Self,
  type Slot,
  type SlotDefinition,
  type SlotFactory,
  type SlotRecord,
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

/** A `field(path)` api, as `handles` gives it. */
const fielded = <Values>(form: Extendable<Values>) =>
  defineExtension(form, { name: 'fielded', api: () => ({ field: {} as BuiltInApis<Values>['field'] }) });

const isString = (value: unknown): value is string => typeof value === 'string';

/** `mask` on string fields. */
const mask = <Values>(form: Extendable<Values, Needs<Values, 'field'>>) =>
  defineExtension(form, {
    name: 'mask',
    needs: { api: ['field'] },
    api: () => ({}),
    fields: on(isString)(field => ({ mask: (pattern: string) => pattern + field.get() })),
  });

const masked = login.extend(fielded).extend(mask);

describe('defineExtension', () => {
  it('lists the needs of the Extendable parameter', () => {
    expectTypeOf(masked.create().field('email').mask('#')).toEqualTypeOf<string>();
  });

  it('rejects a needs list with a missing name', () => {
    accepts(<Values>(form: Extendable<Values, Needs<Values, 'field'>, { values: Values }>) =>
      // @ts-expect-error The state key `values` is not listed.
      defineExtension(form, { name: 'missing', needs: { api: ['field'] }, api: () => ({}) }),
    );
  });

  it('rejects a needs list with an extra name', () => {
    accepts(<Values>(form: Extendable<Values>) =>
      // @ts-expect-error The parameter states no `field` need.
      defineExtension(form, { name: 'extra', needs: { api: ['field'] }, api: () => ({}) }),
    );
  });

  it('rejects a definition without needs when the parameter states one', () => {
    accepts(<Values>(form: Extendable<Values, Needs<Values, 'field'>>) =>
      // @ts-expect-error `needs` is required.
      defineExtension(form, { name: 'unlisted', api: () => ({}) }),
    );
  });

  it('types the state of the context by the state factory', () => {
    accepts(<Values>(form: Extendable<Values>) =>
      defineExtension(form, {
        name: 'counter',
        state: () => ({ count: 0 }),
        api: context => {
          // @ts-expect-error The count is a number.
          context.state.count.set('one');
          return {};
        },
      }),
    );
  });
});

describe('Needs, BuiltInApis', () => {
  it('picks the built-in apis by name', () => {
    expectTypeOf<Needs<Login, 'field'>>().toEqualTypeOf<Pick<BuiltInApis<Login>, 'field'>>();
  });

  it('rejects an unknown api name', () => {
    // @ts-expect-error There is no built-in `nope` api.
    accepts<Needs<Login, 'nope'>>({});
  });

  it('rejects an extension whose need is applied after it', () => {
    // @ts-expect-error `field` comes after `mask`.
    login.extend(mask).extend(fielded);
  });

  it('types the field of BuiltInApis by the path', () => {
    const field = {} as BuiltInApis<Login>['field'];
    expectTypeOf(field('email').get()).toEqualTypeOf<string>();
  });

  it('rejects a path that the values do not have', () => {
    const field = {} as BuiltInApis<Login>['field'];
    // @ts-expect-error Login has no name.
    field('name');
  });
});

describe('on, FieldMembers, FieldOf, FieldsOf', () => {
  it('types the members by the condition', () => {
    expectTypeOf(on(isString)(() => ({ mask: 1 }))).toEqualTypeOf<FieldMembers<string, { mask: number }>>();
  });

  it('gives the builder a field of the condition type', () => {
    on(isString)(field => {
      expectTypeOf(field).toEqualTypeOf<FieldOf<string>>();
      return {};
    });
  });

  it('reads the field members of a form back', () => {
    expectTypeOf<FieldsOf<typeof masked>>().toEqualTypeOf<
      FieldMembers<string, { mask: (pattern: string) => string }>
    >();
  });

  it('adds no member to a field whose value does not fit', () => {
    const form = defineForm({ schema: {} as StandardSchemaV1<{ age: number }>, defaultValues: { age: 1 } })
      .extend(fielded)
      .extend(mask)
      .create();
    // @ts-expect-error `age` is a number.
    accepts(form.field('age').mask);
  });

  it('rejects a change of the wrong type on a FieldOf', () => {
    const field = {} as FieldOf<string>;
    // @ts-expect-error The field holds a string.
    field.change(1);
  });

  it('rejects members that are not an object', () => {
    // @ts-expect-error Members are an object.
    on()(() => 1);
  });

  it('gives never for a type that is not a form', () => {
    expectTypeOf<FieldsOf<string>>().toBeNever();
    // @ts-expect-error A string has no field members.
    accepts<FieldsOf<string>>({});
  });
});

/** The `shown` state and the `flag` api that `shownSlots` needs. */
const provides = <Values>(form: Extendable<Values>) =>
  defineExtension(form, { name: 'provides', state: () => ({ shown: true }), api: () => ({ flag: true as const }) });

const shownSlots = defineSlots(
  { name: 'shownSlots', needs: { api: ['flag'], state: ['shown'] } },
  (slot: SlotFactory<{ readonly flag: true }, { readonly shown: boolean }>) => ({
    shown: slot({ element: 'span', props: { name: 'key' }, state: state => ({ shown: state.shown }) }),
  }),
);

const shown = login.extend(provides).extend(slots(slot => ({ ...shownSlots(slot) })));

describe('defineSlots, slots, Slot, SlotFactory, SlotDefinition, SlotRecord', () => {
  it('types the props, the state and the element of each slot', () => {
    expectTypeOf(shownSlots).returns.toEqualTypeOf<{
      shown: Slot<{ readonly name: KeyProp }, { shown: boolean }, 'span'>;
    }>();
  });

  it('accepts a record of slots', () => {
    expectTypeOf<ReturnType<typeof shownSlots>>().toExtend<SlotRecord>();
  });

  it('types an inline slot by the state of the form', () => {
    login.extend(provides).extend(
      slots(slot => ({
        // @ts-expect-error The state has no `nope`.
        lost: slot({ attrs: state => ({ 'data-nope': state.nope }) }),
      })),
    );
  });

  it('rejects a group on a form without its api need', () => {
    const stateOnly = <Values>(form: Extendable<Values>) =>
      defineExtension(form, { name: 'stateOnly', state: () => ({ shown: true }), api: () => ({}) });
    login.extend(stateOnly).extend(
      slots(slot => ({
        // @ts-expect-error The api has no `flag`.
        ...shownSlots(slot),
      })),
    );
  });

  it('rejects a group on a form without its state need', () => {
    const apiOnly = <Values>(form: Extendable<Values>) =>
      defineExtension(form, { name: 'apiOnly', api: () => ({ flag: true as const }) });
    login.extend(apiOnly).extend(
      slots(slot => ({
        // @ts-expect-error The state has no `shown`.
        ...shownSlots(slot),
      })),
    );
  });

  it('rejects a group inside an extension that does not state its needs', () => {
    accepts(<Values>(form: Extendable<Values, { readonly flag: true }>) =>
      defineExtension(form, {
        name: 'lacksState',
        needs: { api: ['flag'] },
        api: () => ({}),
        // @ts-expect-error The extension does not state the `shown` state.
        slots: slot => ({ ...shownSlots(slot) }),
      }),
    );
  });

  it('rejects needs that differ from the slot annotation', () => {
    defineSlots(
      // @ts-expect-error The `shown` state is not listed.
      { name: 'unlisted', needs: { api: ['flag'] } },
      (slot: SlotFactory<{ readonly flag: true }, { readonly shown: boolean }>) => ({ shown: slot({}) }),
    );
  });

  it('rejects an unknown element', () => {
    slots(slot => ({
      // @ts-expect-error There is no `inptu` element.
      field: slot({ element: 'inptu' }),
    }));
  });

  it('rejects a slot that the factory did not make', () => {
    // @ts-expect-error A plain object is not a slot.
    accepts<SlotRecord>({ shown: {} });
  });

  it('types the definition of a slot by its spec', () => {
    expectTypeOf<SlotDefinition<{ name: 'key' }, {}, {}, {}, 'input'>['element']>().toEqualTypeOf<
      'input' | undefined
    >();
  });
});

describe('PartsOf, PartSpec', () => {
  it('reads the parts of a form back', () => {
    expectTypeOf<PartsOf<typeof shown>>().toEqualTypeOf<{
      readonly shown: PartSpec<{ readonly name: KeyProp }, { shown: boolean }, 'span'>;
    }>();
  });

  it('gives never for a type that is not a form', () => {
    // @ts-expect-error A string has no parts.
    accepts<PartsOf<string>>({});
  });

  it('rejects a part spec with an unknown element', () => {
    // @ts-expect-error There is no `inptu` element.
    accepts<PartSpec<{}, {}, 'inptu'>>({} as never);
  });
});

describe('PartHandle, PartEventContext, PartDomProps, PropKind, PropsOf, KeyProp', () => {
  it('gives a slot function the props of the part', () => {
    expectTypeOf<PartHandle<PropsOf<{ name: 'key'; size: 'number' }>, {}>['props']>().toEqualTypeOf<
      PropsOf<{ name: 'key'; size: 'number' }> & PartDomProps
    >();
  });

  it('reads a key prop as a string in a slot', () => {
    expectTypeOf<PropsOf<{ name: 'key' }>['name']>().toEqualTypeOf<string>();
  });

  it('gives an event handler the element', () => {
    expectTypeOf<PartEventContext<{}, {}>['element']>().toEqualTypeOf<HTMLElement | null>();
  });

  it('rejects an unknown prop kind', () => {
    // @ts-expect-error There is no `date` kind.
    accepts<PropKind>('date');
  });

  it('rejects a string for a key prop of a part', () => {
    // @ts-expect-error A key prop is resolved by the adapter.
    accepts<KeyProp>('name');
  });

  it('rejects a DOM value of the wrong type', () => {
    // @ts-expect-error A value is a string, a number or a list of strings.
    accepts<PartDomProps>({ value: true });
  });

  it('rejects a handle with no id', () => {
    // @ts-expect-error The handle has an id.
    accepts<PartHandle<{}, {}>>({ key: '', props: {}, api: {} });
  });

  it('rejects an event context with no element', () => {
    // @ts-expect-error The context has an element.
    accepts<PartEventContext<{}, {}>>({ id: '', key: '', props: {}, api: {} });
  });

  it('rejects props of the wrong type in a slot', () => {
    // @ts-expect-error A number prop is a number.
    accepts<PropsOf<{ size: 'number' }>>({ size: 'big' });
  });
});

describe('Attributes, ElementTag', () => {
  it('holds HTML attributes, a list of strings too', () => {
    expectTypeOf<Attributes['value']>().toEqualTypeOf<string | number | boolean | readonly string[] | undefined>();
  });

  it('is the tag of an HTML element', () => {
    expectTypeOf<'input'>().toExtend<ElementTag>();
  });

  it('rejects an object as an attribute', () => {
    // @ts-expect-error An attribute is not an object.
    accepts<Attributes>({ style: {} });
  });

  it('rejects an unknown tag', () => {
    // @ts-expect-error There is no `inptu` element.
    accepts<ElementTag>('inptu');
  });
});

describe('createEffect', () => {
  it('types the selection by the state of the instance', () => {
    createEffect(
      form.create(),
      state => state.values.email,
      email => void expectTypeOf(email).toEqualTypeOf<string>(),
    );
  });

  it('rejects a key that the state does not have', () => {
    createEffect(
      form.create(),
      // @ts-expect-error The state has no status.
      state => state.status,
      () => {},
    );
  });
});

type Address = { street: string; geo: { lat: number } };

const address = defineScope({
  schema: {} as StandardSchemaV1<Address>,
  defaultValues: { street: '', geo: { lat: 0 } },
});

const checkout = defineForm({ schema, defaultValues: { email: '', password: '' }, scopes: { billing: address } });

describe('defineScope, ScopeDefinition', () => {
  it('types the scope by its schema', () => {
    expectTypeOf(address).toEqualTypeOf<ScopeDefinition<Address>>();
  });

  it('rejects defaultValues that do not match the schema', () => {
    // @ts-expect-error The street is not a string.
    defineScope({ schema: {} as StandardSchemaV1<Address>, defaultValues: { street: 1, geo: { lat: 0 } } });
  });
});

describe('ScopedValues', () => {
  it('adds one entry per placed scope to the values', () => {
    expectTypeOf<ValuesOf<typeof checkout>>().toEqualTypeOf<Login & ScopedValues<{ billing: typeof address }>>();
  });

  it('types a placed scope by its definition', () => {
    expectTypeOf<ScopedValues<{ billing: typeof address }>>().toEqualTypeOf<{ readonly billing: Address }>();
  });

  it('rejects a scope key that the own values have', () => {
    defineForm({
      schema,
      defaultValues: { email: '', password: '' },
      // @ts-expect-error `email` is an own key of the form.
      scopes: { email: address },
    });
  });

  it('rejects a scope key with a dot', () => {
    defineForm({
      schema,
      defaultValues: { email: '', password: '' },
      // @ts-expect-error A scope key is one key.
      scopes: { 'billing.home': address },
    });
  });
});
