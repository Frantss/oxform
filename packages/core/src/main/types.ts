import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ReadonlyStore } from '@tanstack/store';
import type { ValuesApi } from '#behaviors/values';
import type { Path, PathValue, Unsubscribe, Updater } from './path-types';

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

/** The names that `needs` lists at runtime. */
export interface NeedNames {
  readonly api?: readonly string[];
  readonly state?: readonly string[];
}

/** A list of names that holds every name of `All`. A missing name becomes a required `missing` member. */
type Covering<Listed extends readonly string[], All> = Listed &
  ([Exclude<All, Listed[number]>] extends [never] ? unknown : { readonly missing: Exclude<All, Listed[number]> });

/**
 * The `needs` member of a definition. It lists every api name and state key of the `Extendable` parameter, and no
 * other name. It is required when the parameter states a need (D51).
 */
export type NeedsMember<Provides, State, ApiNames extends readonly string[], StateNames extends readonly string[]> = [
  keyof Provides | keyof State,
] extends [never]
  ? { readonly needs?: { readonly api?: readonly []; readonly state?: readonly [] } }
  : {
      readonly needs: ([keyof Provides] extends [never]
        ? { readonly api?: readonly [] }
        : { readonly api: Covering<ApiNames, keyof Provides> }) &
        ([keyof State] extends [never]
          ? { readonly state?: readonly [] }
          : { readonly state: Covering<StateNames, keyof State> });
    };

/** A field handle as a field-members builder sees it, with its value typed `Value`. */
export interface FieldOf<Value> {
  get(): Value;
  change(updater: Updater<Value>): void;
}

declare const fieldMembers: unique symbol;

/** Members for the field handles whose value extends `Condition`. `on` builds them. */
export interface FieldMembers<Condition, Members> {
  readonly [fieldMembers]?: { readonly condition: Condition; readonly members: Members };
}

/** The members of `Fields` on a field whose value is `Value`: the intersection of the members whose condition holds. */
type MembersFor<Fields, Value> = (
  Fields extends FieldMembers<infer Condition, infer Members>
    ? Value extends Condition
      ? (members: Members) => void
      : (members: {}) => void
    : never
) extends (members: infer Intersection) => void
  ? Intersection
  : never;

/** The members of `Fields` on a field of `Values` at `At`. */
export type FieldMembersOf<Fields, Values, At extends string> = MembersFor<Fields, PathValue<Values, At>>;

declare const handlesChecks: unique symbol;

/** `handles` adds it to its api type, so the field sugar knows the check names of the chain. */
export type HandlesChecks<Checks extends string> = { readonly [handlesChecks]?: Checks };

/** The check names of an api that has handles, or `never`. */
export type ChecksOfApi<Api> = Api extends { readonly [handlesChecks]?: infer Checks }
  ? [Checks] extends [string]
    ? Checks
    : never
  : never;

/**
 * What an adapter needs from an instance, and what is not in its public api: new options on each render, and a
 * way to stop the work in progress when the component leaves. Neither ends the instance, so it can mount again.
 */
export interface AdapterControls {
  /** Merges the options like `create`: over the options of `configure` and `defineForm`. */
  setOptions(options: Readonly<Record<string, unknown>>): void;
  /** Runs the cleanups, and keeps them registered. */
  unmount(): void;
}

/** The api of the built-in extensions by name. `Needs<V, 'field'>` states a need by name. */
export interface BuiltInApis<Values> {
  readonly values: ValuesApi<Values>;
  /** A stand-in until `handles` (TK-027): the field handle of a path. */
  readonly field: <At extends Path<Values>>(path: At) => FieldOf<PathValue<Values, At>>;
}

export type Needs<Values, Names extends keyof BuiltInApis<Values>> = Pick<BuiltInApis<Values>, Names>;

/** A tag that a slot can render: every HTML element of the DOM library (D13). */
export type ElementTag = keyof HTMLElementTagNameMap;

/** How a part passes a prop to a slot. A `key` prop is a path of the form, or of the scope of the part. */
export type PropKind = 'key' | OptionKind;

type PropType<Kind extends PropKind> = Kind extends 'key' | 'string' | 'id'
  ? string
  : Kind extends 'number'
    ? number
    : Kind extends 'boolean'
      ? boolean
      : Kind extends 'list'
        ? string | readonly string[]
        : unknown;

/** The props of a part, as a slot body reads them. A `key` prop is a string. */
export type PropsOf<Spec> = {
  readonly [Name in keyof Spec]: Spec[Name] extends PropKind ? PropType<Spec[Name]> : never;
};

declare const keyProp: unique symbol;

/**
 * The type of a `key` prop in the public props of a part. A slot does not know the values of the form, so the
 * adapter replaces it with a path of the form, or of the scope.
 */
export interface KeyProp {
  readonly [keyProp]: true;
}

type SlotPropsOf<Spec> = {
  readonly [Name in keyof Spec]: Spec[Name] extends 'key'
    ? KeyProp
    : Spec[Name] extends PropKind
      ? PropType<Spec[Name]>
      : never;
};

/** What a part is: its props, the state that its children can read, and its element. */
export interface PartSpec<Props = {}, State = {}, Tag extends ElementTag = 'div'> {
  readonly props: Props;
  readonly state: State;
  readonly element: Tag;
}

/** DOM props that a slot may read from the part, although it does not declare them. */
export interface PartDomProps {
  readonly type?: string;
  readonly value?: string | number | readonly string[];
}

/** The part as a slot function sees it: the form id, the `key` prop, the props and the api of the form. */
export interface PartHandle<Props, Api> {
  readonly id: string;
  readonly key: string;
  readonly props: Props & PartDomProps;
  readonly api: Api;
}

export interface PartEventContext<Props, Api> extends PartHandle<Props, Api> {
  readonly element: HTMLElement | null;
}

/** HTML attributes by their HTML names (`for`, `readonly`). Each adapter maps them to its own names. */
export type Attributes = Readonly<Record<string, string | number | boolean | readonly string[] | undefined>>;

/**
 * One slot. `text`, `present`, `state` and `attrs` are pure functions of the store state, so they run on a server.
 * `on` and `bind` run in a browser only. The functions are properties, not methods, so their parameters are compared
 * strictly and a group that needs state that the form does not have is a type error.
 */
export interface SlotDefinition<Spec, SlotState, Api, State, Tag extends ElementTag = 'div'> {
  /** The element of the part, unless the caller of `createParts` chooses another. */
  readonly element?: Tag;
  readonly props?: Spec;
  /** What the part shows when it gets no children. */
  readonly text?: (state: NoInfer<SlotState>) => string | undefined;
  readonly present?: (state: State, part: PartHandle<PropsOf<Spec>, Api>) => boolean;
  readonly state?: (state: State, part: PartHandle<PropsOf<Spec>, Api>) => SlotState;
  readonly attrs?: (state: State, part: PartHandle<PropsOf<Spec>, Api>) => Attributes;
  readonly on?: {
    readonly [Event in keyof HTMLElementEventMap]?: (
      event: HTMLElementEventMap[Event],
      context: PartEventContext<PropsOf<Spec>, Api>,
    ) => void;
  };
  readonly bind?: (element: HTMLElement, part: PartHandle<PropsOf<Spec>, Api>) => void | (() => void);
}

declare const slotBrand: unique symbol;

export interface Slot<Props = {}, SlotState = {}, Tag extends ElementTag = 'div'> {
  readonly [slotBrand]: PartSpec<Props, SlotState, Tag>;
}

/** Makes a slot. `Spec` comes from `props`, `SlotState` from `state` and `Tag` from `element`. */
export type SlotFactory<Api, State> = <
  const Spec extends Readonly<Record<string, PropKind>> = {},
  SlotState = {},
  const Tag extends ElementTag = 'div',
>(
  definition: SlotDefinition<Spec, SlotState, Api, State, Tag>,
) => Slot<SlotPropsOf<Spec>, SlotState, Tag>;

export type SlotRecord = Readonly<Record<string, Slot<any, any, any>>>;

/** Replaces each `KeyProp` with a path of `Values`, the values of the form or of the scope of the part. */
export type ResolveKeys<Props, Values> = {
  readonly [Name in keyof Props]: Props[Name] extends KeyProp ? Path<Values> : Props[Name];
};

/** The parts of a form, from its slots. An adapter renders one part per slot. */
export type PartsFromSlots<Slots> = {
  readonly [Name in keyof Slots]: Slots[Name] extends Slot<infer Props, infer SlotState, infer Tag>
    ? PartSpec<Props, SlotState, Tag>
    : never;
};

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
/** `form.field(path)` returns the base handle plus the members of `Fields` whose condition holds. */
type WithFieldMembers<Values, Api, Fields> = Api extends { readonly field: (path: any) => any }
  ? Omit<Api, 'field'> & {
      readonly field: <At extends Path<Values>>(
        path: At,
      ) => FieldOf<PathValue<Values, At>> & FieldMembersOf<Fields, Values, At>;
    }
  : Api;

/** One live form: the api of its extensions, its `id`, its `store` and `destroy()`. */
export type Instance<Values, Api = {}, State = {}, Fields = never> = WithFieldMembers<Values, Api, Fields> & {
  readonly id: string;
  readonly store: ReadonlyStore<State>;
  /** Runs every cleanup and stops the option listeners. Only the creator of the instance calls it. */
  destroy(): void;
};

type Typed<Types> = { readonly [formTypes]: Types };

export type ValuesOf<F> = F extends Typed<FormTypes<infer Values, any, any, any, any, any>> ? Values : never;
export type ApiOf<F> = F extends Typed<FormTypes<any, infer Api, any, any, any, any>> ? Api : never;
export type StateOf<F> = F extends Typed<FormTypes<any, any, any, infer State, any, any>> ? State : never;
export type PartsOf<F> =
  F extends Typed<FormTypes<any, any, any, any, infer Slots, any>> ? PartsFromSlots<Slots> : never;
export type FieldsOf<F> = F extends Typed<FormTypes<any, any, any, any, any, infer Fields>> ? Fields : never;
export type InstanceOf<F> =
  F extends Typed<FormTypes<infer Values, infer Api, any, infer State, any, infer Fields>>
    ? Instance<Values, Api, State, Fields>
    : never;
/** The options that `create` takes, with `Self` resolved to the instance. */
export type OptionsOf<F> =
  F extends Typed<FormTypes<infer Values, infer Api, infer Options, infer State, any, infer Fields>>
    ? ResolveSelf<BaseOptions<Values> & Options, Instance<Values, Api, State, Fields>>
    : never;
