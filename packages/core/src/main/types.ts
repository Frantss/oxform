import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ReadonlyStore } from '@tanstack/store';
import type { Unsubscribe, Updater } from './path-types';

/** How an adapter passes an option. The descriptor gives the option its TypeScript type. */
export type OptionKind = 'string' | 'number' | 'boolean' | 'list' | 'value' | 'callback' | 'action' | 'id' | 'key';

declare const optionType: unique symbol;

/** An option: the runtime kind and the TypeScript type, declared together. At runtime it is `{ kind }`. */
export interface OptionDescriptor<Type = unknown, Kind extends OptionKind = OptionKind> {
  readonly kind: Kind;
  readonly [optionType]?: Type;
}

export type OptionDescriptors = Readonly<Record<string, OptionDescriptor<any>>>;

/** The options of a descriptor record. Every option is optional. */
export type OptionsFrom<Descriptors> = {
  readonly [Name in keyof Descriptors]?: Descriptors[Name] extends OptionDescriptor<infer Type> ? Type : never;
};

declare const selfBrand: unique symbol;

/**
 * The instance, as a parameter of an option: `option.action<(values: V, form: Self) => unknown>()`. An extension
 * cannot name the instance, because later extensions add to it. `configure` and `create` replace `Self` with it.
 */
export interface Self {
  readonly [selfBrand]: true;
}

type ReplaceSelf<Parameters extends readonly unknown[], Instance> = {
  [Index in keyof Parameters]: Parameters[Index] extends Self ? Instance : Parameters[Index];
};

type ResolveSelf<Options, Instance> = {
  [Name in keyof Options]-?: Required<Options>[Name] extends (...args: infer Parameters) => infer Result
    ? (...args: ReplaceSelf<Parameters, Instance>) => Result
    : Required<Options>[Name];
};

/** The options of every form. `defineForm` gives `schema` and `defaultValues`, and a later layer may replace them. */
export interface BaseOptions<Values> {
  readonly id?: string;
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
}

export interface StateSlice<Slice> {
  get(): Slice;
  set(next: Updater<Slice>): void;
}

/** What the `api` of an extension gets. `state` holds one slice per key of the extension's `state` factory. */
export interface FormContext<Options = unknown, State = unknown> {
  /** Read it inside a method, and do not keep the result, so the options stay current. */
  options(): Options;
  onOptions(listener: (options: Options, previous: Options) => void): Unsubscribe;
  /** The cleanup runs at each unmount and at `destroy()`. It stays registered, so it can run many times. */
  onDestroy(cleanup: () => void): void;
  /** The instance. Call it from a method or a handler: it is available after every `api` has run. */
  instance<Instance = unknown>(): Instance;
  readonly state: { readonly [Key in keyof State]: StateSlice<State[Key]> };
  readonly store: ReadonlyStore<State>;
}

declare const extendable: unique symbol;

/**
 * The input of an extension: the form so far. `Provides` is the api it needs and `State` the state it needs. A form
 * is assignable when its api and state cover both. At runtime it is the form.
 */
export interface Extendable<Values, Provides = {}, State = {}> {
  readonly [extendable]: { readonly values: Values; readonly provides: Provides; readonly state: State };
}

/** The names that `needs` lists: every api name and state key that the `Extendable` parameter states. */
export interface NeedNames {
  readonly api?: readonly string[];
  readonly state?: readonly string[];
}

declare const extensionBrand: unique symbol;

/** What `defineExtension` returns: the types that an extension adds. `form.extend` collects them. */
export interface Extension<Options = {}, State = {}, Api = {}, Slots = {}, Fields = never> {
  readonly [extensionBrand]: {
    readonly options: Options;
    readonly state: State;
    readonly api: Api;
    readonly slots: Slots;
    readonly fields: Fields;
  };
}

declare const formTypes: unique symbol;

type FormTypes<Values, Api, Options, State, Slots, Fields> = {
  readonly values: Values;
  readonly api: Api;
  readonly options: Options;
  readonly state: State;
  readonly slots: Slots;
  readonly fields: Fields;
};

/** The options of `configure` and `create`: the form's own and those of its extensions, with `Self` resolved. */
type CreateOptions<Values, Api, Options, State, Fields> = Partial<
  ResolveSelf<BaseOptions<Values> & Options, Instance<Values, Api, State, Fields>>
>;

/** An immutable form. `extend` and `configure` return a new form, so a form is safe at module scope. */
export interface Form<Values, Api = {}, Options = {}, State = {}, Slots = {}, Fields = never> extends Extendable<
  Values,
  Api,
  State
> {
  readonly [formTypes]: FormTypes<Values, Api, Options, State, Slots, Fields>;
  readonly name: string;
  /**
   * Applies an extension: a function of the form so far that returns `defineExtension(form, {...})`. A missing need
   * is a type error here, and a runtime error at `create`. A duplicate option name throws here.
   */
  extend<NextOptions, NextState, NextApi, NextSlots, NextFields>(
    extension: (
      form: Extendable<Values, Api, State>,
    ) => Extension<NextOptions, NextState, NextApi, NextSlots, NextFields>,
  ): Form<
    Values,
    Api & NextApi,
    Options & NextOptions,
    State & NextState,
    Omit<Slots, keyof NextSlots> & NextSlots,
    Fields | NextFields
  >;
  /**
   * Applies a preset: a function from form to form, such as `standard`. It is the last overload, because the first
   * one types the parameter of an inline extension, `form.extend(form => defineExtension(form, ...))` (D18).
   */
  extend<Result extends AnyForm>(preset: (form: Form<Values, Api, Options, State, Slots, Fields>) => Result): Result;
  /**
   * Default options for every instance. It takes the options of the extensions applied so far. Calls merge, and a
   * later call wins. The options of `create` win over them.
   */
  configure(
    options: CreateOptions<Values, Api, Options, State, Fields>,
  ): Form<Values, Api, Options, State, Slots, Fields>;
  /** Makes an instance. The options win over those of `configure` and `defineForm`. */
  create(options?: CreateOptions<Values, Api, Options, State, Fields>): Instance<Values, Api, State, Fields>;
}

export type AnyForm = Form<any, any, any, any, any, any>;

/** One live form: the api of its extensions, its `id`, its `store` and `destroy()`. */
/** `Values` and `Fields` type the field handles (TK-013). */
export type Instance<_Values, Api = {}, State = {}, _Fields = never> = Api & {
  readonly id: string;
  readonly store: ReadonlyStore<State>;
  /** Runs every cleanup and stops the option listeners. Only the creator of the instance calls it. */
  destroy(): void;
};

type Typed<Types> = { readonly [formTypes]: Types };

export type ValuesOf<F> = F extends Typed<FormTypes<infer Values, any, any, any, any, any>> ? Values : never;
export type ApiOf<F> = F extends Typed<FormTypes<any, infer Api, any, any, any, any>> ? Api : never;
export type StateOf<F> = F extends Typed<FormTypes<any, any, any, infer State, any, any>> ? State : never;
export type InstanceOf<F> =
  F extends Typed<FormTypes<infer Values, infer Api, any, infer State, any, infer Fields>>
    ? Instance<Values, Api, State, Fields>
    : never;
/** The options that `create` takes, with `Self` resolved to the instance. */
export type OptionsOf<F> =
  F extends Typed<FormTypes<infer Values, infer Api, infer Options, infer State, any, infer Fields>>
    ? ResolveSelf<BaseOptions<Values> & Options, Instance<Values, Api, State, Fields>>
    : never;
