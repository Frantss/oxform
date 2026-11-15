// SPIKE: public types and signatures only. Nothing here is implemented. Every value is `declare`d.
//
// One file stands in for three entry points, marked by banners:
//   @oxform/core            kernel: defineForm, defineExtension, option, on, slots, scopes, behavior types
//   @oxform/core/standard   `standard`, a preset built only from the kernel's public API
//   @oxform/react           createParts, usePart
//
// Typing model (see `extension-api.md` and the type tests in `../../type-tests`):
//   - `defineForm` infers `Values` from `schema`. Every later type is inferred from there, so there is no
//     hand-written kind and no higher-kinded encoding.
//   - An extension is a function of the form so far, `<V>(form: Extendable<V, Needs>) => defineExtension(form, {...})`.
//     `form.extend(extension)` instantiates `V`, checks the needs against the api so far, and accumulates the
//     options, state, api, slots and field members that the extension's own object declares.

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ReadonlyStore } from '@tanstack/store';
import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  HTMLAttributes,
  JSX,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import type { DeepKeys, DeepKeysOfType, DeepValue } from '../../../../packages/core/src/types/deep';

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: foundations
// ---------------------------------------------------------------------------------------------------------

export type Path<Values> = DeepKeys<Values>;
export type PathValue<Values, P extends string> = DeepValue<Values, P>;
/** Paths that hold an object, so `scope` cannot be given a string or number field. */
export type ObjectPath<Values> = DeepKeysOfType<Values, object | null | undefined>;
export type ArrayPath<Values> = DeepKeysOfType<Values, readonly unknown[] | null | undefined>;
export type ArrayItem<Values, P extends string> =
  NonNullable<PathValue<Values, P>> extends readonly (infer Item)[] ? Item : never;

export type ArrayValue<Values, P extends string> = Extract<NonNullable<PathValue<Values, P>>, readonly unknown[]>;

export type Updater<Value> = Value | ((current: Value) => Value);
export type MaybePromise<Value> = Value | Promise<Value>;
export type Unsubscribe = () => void;
export type ValidationEvent = 'change' | 'blur' | 'focus' | 'submit';
export type DeepPartial<Value> = Value extends object ? { [Key in keyof Value]?: DeepPartial<Value[Key]> } : Value;

/** How an adapter passes an option. It does not give the option a TypeScript type: the descriptor does. */
export type OptionKind = 'string' | 'number' | 'boolean' | 'list' | 'value' | 'callback' | 'action' | 'id' | 'key';

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: parts and slots
// ---------------------------------------------------------------------------------------------------------

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

/** The props of a part as a slot body reads them: a `key` prop is a plain string. */
export type PropsOf<Spec> = {
  readonly [Name in keyof Spec]: Spec[Name] extends PropKind ? PropType<Spec[Name]> : never;
};

declare const keyProp: unique symbol;
/**
 * The type of a `key` prop in a part's public props. A slot does not know the form's values, so it cannot type the
 * name. The component does: `ResolveKeys` turns a `KeyProp` into `Path<Values>` of the form, or of the scope.
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

/** Replaces each `KeyProp` with a path of `Values`. */
export type ResolveKeys<Props, Values> = {
  readonly [Name in keyof Props]: Props[Name] extends KeyProp ? Path<Values> : Props[Name];
};

/** What a part declares for a slot: its props, the state its children can read, and the element it renders in. */
export interface PartSpec<Props = {}, State = {}, Tag extends ElementTag = 'div'> {
  readonly props: Props;
  readonly state: State;
  readonly element: Tag;
}

/** DOM props that a slot may read from the part although it does not declare them. */
export interface PartDomProps {
  readonly type?: string;
  readonly value?: string | number | readonly string[];
}

export interface PartHandle<Props, Api> {
  readonly id: string;
  readonly key: string;
  readonly props: Props & PartDomProps;
  readonly api: Api;
}

export interface PartEventContext<Props, Api> extends PartHandle<Props, Api> {
  readonly el: HTMLElement | null;
}

export type Attributes = Readonly<Record<string, string | number | boolean | readonly string[] | undefined>>;

/**
 * `attrs`, `state` and `present` are pure: they run on the server. DOM work goes in `bind`.
 * The functions are properties, not methods, so a slot group's need for state is checked strictly. A method's
 * parameters are compared bivariantly, and a group that needs state the form lacks would compile.
 */
export interface SlotDefinition<Spec, SlotState, Api, State, Tag extends ElementTag = 'div'> {
  /** The element the part renders in, unless the caller chooses another. */
  readonly element?: Tag;
  readonly props?: Spec;
  /** What the part shows when it is given no children. */
  readonly text?: (state: SlotState) => string | undefined;
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

/** No explicit generics: `Spec` comes from `props`, and `SlotState` from the `state` function. */
export type SlotFactory<Api, State> = <
  const Spec extends Readonly<Record<string, PropKind>> = {},
  SlotState = {},
  const Tag extends ElementTag = 'div',
>(
  definition: SlotDefinition<Spec, SlotState, Api, State, Tag>,
) => Slot<SlotPropsOf<Spec>, SlotState, Tag>;

export type SlotRecord = Readonly<Record<string, Slot<any, any, any>>>;

/** The parts of a form, from its slot record. An adapter renders one component per part. */
export type PartsFromSlots<Slots> = {
  readonly [Name in keyof Slots]: Slots[Name] extends Slot<infer Props, infer SlotState, infer Tag>
    ? PartSpec<Props, SlotState, Tag>
    : never;
};

/**
 * A reusable group of slots. Annotate the `slot` parameter with what the slots need (`SlotFactory<Api, State>`).
 * An extension uses it by spreading it into `slots`, and it fails to compile if the extension's api and state lack that.
 */
export declare function defineSlots<Api, State, Slots extends SlotRecord>(
  build: (slot: SlotFactory<Api, State>) => Slots,
): (slot: SlotFactory<Api, State>) => Slots;

/**
 * An extension that only adds slots. Nothing is declared: `slot` is typed by the api and state of the form that
 * `.extend` applies it to, so each slot group checks its own needs against them. A group whose api or state the form
 * lacks fails to compile at the group call. A slot with the key of an earlier slot replaces it.
 *
 *     form.extend(slots(slot => ({ ...fieldSlots(slot), ...submitSlots(slot) })))
 *
 * Use `defineExtension` for an extension that adds api, options or state.
 */
export declare function slots<Values, Provides, NeedState, Slots extends SlotRecord>(
  build: (slot: SlotFactory<Provides, NeedState>) => Slots,
): (form: Extendable<Values, Provides, NeedState>) => Extension<{}, {}, {}, Slots, never>;

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: options and context
// ---------------------------------------------------------------------------------------------------------

declare const optionType: unique symbol;
/** An option: the runtime kind an adapter needs, and the TypeScript type, declared together. */
export interface OptionDescriptor<Type = unknown, Kind extends OptionKind = OptionKind> {
  readonly kind: Kind;
  readonly [optionType]?: Type;
}
export type OptionDescriptors = Readonly<Record<string, OptionDescriptor<any>>>;

/** The options type of a descriptor record. Every option is optional: the caller gives them to `create`. */
export type OptionsFrom<Descriptors> = {
  readonly [Name in keyof Descriptors]?: Descriptors[Name] extends OptionDescriptor<infer Type> ? Type : never;
};

export declare const option: {
  string<Type extends string = string>(): OptionDescriptor<Type, 'string'>;
  number(): OptionDescriptor<number, 'number'>;
  boolean(): OptionDescriptor<boolean, 'boolean'>;
  list<Type extends readonly unknown[] = readonly string[]>(): OptionDescriptor<Type, 'list'>;
  value<Type>(): OptionDescriptor<Type, 'value'>;
  callback<Type extends (...args: any[]) => unknown>(): OptionDescriptor<Type, 'callback'>;
  action<Type extends (...args: any[]) => unknown>(): OptionDescriptor<Type, 'action'>;
  id(): OptionDescriptor<string, 'id'>;
  key(): OptionDescriptor<string, 'key'>;
};

declare const selfBrand: unique symbol;
/**
 * The form instance, as an option's parameter: `option.action<(values: V, form: Self) => unknown>()`. An extension
 * cannot name the instance type, since later extensions add to it. `create` replaces `Self` with the instance.
 */
export interface Self {
  readonly [selfBrand]: true;
}

type ReplaceSelf<Parameters extends readonly unknown[], Instance> = {
  [Index in keyof Parameters]: Parameters[Index] extends Self ? Instance : Parameters[Index];
};
export type ResolveSelf<Options, Instance> = {
  [Name in keyof Options]-?: Required<Options>[Name] extends (...args: infer Parameters) => infer Result
    ? (...args: ReplaceSelf<Parameters, Instance>) => Result
    : Required<Options>[Name];
};

/** The options every form has. `schema` and `defaultValues` come from `defineForm`, and a caller may override them. */
export interface BaseOptions<Values> {
  readonly id?: string;
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
}

export interface StateSlice<Slice> {
  get(): Slice;
  set(next: Slice | ((current: Slice) => Slice)): void;
}

/** What an extension's `api` receives. `state` has one slice per key the extension's `state` factory returned. */
export interface FormContext<Options = unknown, State = unknown> {
  /** Read inside methods, never keep the result, so values stay current. */
  options(): Options;
  onOptions(listener: (options: Options, previous: Options) => void): Unsubscribe;
  /** Runs when the adapter destroys the instance. Nothing needs it on a server render. */
  onDestroy(cleanup: () => void): void;
  /** The instance under construction. Call it from event handlers, never inside `api`, where it is incomplete. */
  instance<Instance = unknown>(): Instance;
  readonly state: { readonly [Key in keyof State]: StateSlice<State[Key]> };
  readonly store: ReadonlyStore<State>;
}

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: forms and extensions
// ---------------------------------------------------------------------------------------------------------

declare const extendable: unique symbol;
/**
 * The input of an extension: the form so far. `Provides` is the api it must have, and `State` the state slices it
 * must have. A form is assignable when what it has covers both. At runtime it is the form itself.
 */
export interface Extendable<Values, Provides = {}, State = {}> {
  readonly [extendable]: { readonly values: Values; readonly provides: Provides; readonly state: State };
}

/** The apis of the kernel's behaviors, by name. `Needs<V, 'values' | 'validation'>` states a dependency by name. */
export interface KernelApis<Values> {
  readonly values: ValuesApi<Values>;
  readonly validation: ValidationApi<Values>;
  readonly error: CheckApi<Values, 'error'>;
  readonly status: StatusApi<Values>;
  readonly events: EventsApi<Values>;
  readonly arrays: ArraysApi<Values>;
  readonly reset: ResetApi<Values>;
  readonly submit: SubmitApi<Values>;
  readonly field: Scope<Values>['field'];
  readonly array: Scope<Values>['array'];
  readonly scope: Scope<Values>['scope'];
}
export type Needs<Values, Names extends keyof KernelApis<Values>> = Pick<KernelApis<Values>, Names>;

declare const fieldMembers: unique symbol;
/** Members for the field handles whose value extends `Condition`. Built with `on`. */
export interface FieldMembers<Condition, Members> {
  readonly [fieldMembers]?: { readonly condition: Condition; readonly members: Members };
}

/** A field handle as a field-members builder sees it. Its value is typed `Value`. */
export interface FieldOf<Value> {
  readonly state: FieldState<Value>;
  get(): Value;
  change(updater: Updater<Value>, options?: FieldChangeOptions): void;
  focus(options?: FieldFocusOptions): void;
  blur(options?: FieldFocusOptions): void;
  register(element: HTMLElement | null): void;
  unregister(): void;
  reset(options?: { readonly value?: Value }): void;
}

/**
 * `fields: on<string>(isString)(field => ({ ... }))`. The members go on every `form.field(path)` handle, and on every
 * scoped handle, with `path` relative to the scope. They exist in the types on fields whose value extends `Condition`.
 * Types are erased at runtime, so `guard` decides at runtime. Without a guard the members go on every field.
 */
export declare function on<Condition = unknown>(
  guard?: (value: unknown) => value is Condition,
): <Members extends object>(
  build: (field: FieldOf<Condition>, path: string) => Members,
) => FieldMembers<Condition, Members>;

declare const extensionBrand: unique symbol;
/** What `defineExtension` returns: the types an extension adds. `form.extend` accumulates them. */
export interface Extension<Options, State, Api, Slots, Fields> {
  readonly [extensionBrand]: {
    readonly options: Options;
    readonly state: State;
    readonly api: Api;
    readonly slots: Slots;
    readonly fields: Fields;
  };
}

/**
 * One object holds everything an extension adds. `form` gives `Values` and the needs: it is the only place an
 * extension names its dependencies. Everything else is inferred from the object.
 */
export declare function defineExtension<
  Values,
  Provides,
  NeedState,
  Descriptors extends OptionDescriptors = {},
  State extends object = {},
  Api extends object = {},
  Slots extends SlotRecord = {},
  Fields = never,
>(
  form: Extendable<Values, Provides, NeedState>,
  definition: {
    readonly name: string;
    readonly options?: Descriptors;
    /** Runs once per instance. The store starts from it. `values` reads `defaultValues` here. */
    readonly state?: (options: BaseOptions<Values> & OptionsFrom<Descriptors>) => State;
    /** Runs once per instance, on the server too. It must be inert: no DOM, no timers, no requests. */
    readonly api: (ctx: FormContext<BaseOptions<Values> & OptionsFrom<Descriptors>, State>, deps: Provides) => Api;
    readonly slots?: (slot: SlotFactory<Provides & Api, NeedState & State>) => Slots;
    readonly fields?: Fields;
  },
): Extension<OptionsFrom<Descriptors>, State, Api, Slots, Fields>;

declare const formTypes: unique symbol;
export interface FormTypes<Values, Api, Options, State, Slots, Fields> {
  readonly values: Values;
  readonly api: Api;
  readonly options: Options;
  readonly state: State;
  readonly slots: Slots;
  readonly fields: Fields;
}

/** An immutable form. `extend` returns a new form, so a form is safe at module scope. */
export interface Form<Values, Api = {}, Options = {}, State = {}, Slots = {}, Fields = never> extends Extendable<
  Values,
  Api,
  State
> {
  readonly [formTypes]: FormTypes<Values, Api, Options, State, Slots, Fields>;
  readonly name: string;
  /** The runtime kind of every option, for an adapter. */
  readonly optionKinds: Readonly<Record<string, OptionKind>>;
  /**
   * Applies an extension: a function of the form so far that returns `defineExtension(form, {...})`. A missing need
   * is a type error here. A duplicate option, state key or api key throws when the form is built.
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
  /** A preset: a function from form to form, such as `standard`. */
  extend<Result extends AnyForm>(preset: (form: Form<Values, Api, Options, State, Slots, Fields>) => Result): Result;
  /**
   * Default options for every instance, typed like the options of `create`: the form's own and those of the
   * extensions applied so far. An option of an extension applied later is not accepted here. Call `configure`
   * again after it. Successive calls merge, and a later call wins. `create` options win over all of them.
   */
  configure(
    options: Partial<ResolveSelf<BaseOptions<Values> & Options, Instance<Values, Api, State, Fields>>>,
  ): Form<Values, Api, Options, State, Slots, Fields>;
  create(
    options?: Partial<ResolveSelf<BaseOptions<Values> & Options, Instance<Values, Api, State, Fields>>>,
  ): Instance<Values, Api, State, Fields>;
}

export type AnyForm = Form<any, any, any, any, any, any>;

export type ValuesOf<F> = F extends { readonly [formTypes]: FormTypes<infer Values, any, any, any, any, any> }
  ? Values
  : never;
export type ApiOf<F> = F extends { readonly [formTypes]: FormTypes<any, infer Api, any, any, any, any> } ? Api : never;
export type StateOf<F> = F extends { readonly [formTypes]: FormTypes<any, any, any, infer State, any, any> }
  ? State
  : never;
export type FieldsOf<F> = F extends { readonly [formTypes]: FormTypes<any, any, any, any, any, infer Fields> }
  ? Fields
  : never;
export type PartsOf<F> = F extends { readonly [formTypes]: FormTypes<any, any, any, any, infer Slots, any> }
  ? PartsFromSlots<Slots>
  : never;
export type InstanceOf<F> =
  F extends Form<infer Values, infer Api, any, infer State, any, infer Fields>
    ? Instance<Values, Api, State, Fields>
    : never;
/** The options `create` takes: the form's own and its extensions', with `Self` resolved to the instance. */
export type OptionsOf<F> =
  F extends Form<infer Values, infer Api, infer Options, infer State, any, infer Fields>
    ? ResolveSelf<BaseOptions<Values> & Options, Instance<Values, Api, State, Fields>>
    : never;

declare const handlesChecks: unique symbol;
/** The check names of an api that has handles, or `never`. */
export type ChecksOfApi<Api> = Api extends { readonly [handlesChecks]?: infer Checks }
  ? [Checks] extends [string]
    ? Checks
    : never
  : never;

type MembersFor<Fields, Value> = (
  Fields extends FieldMembers<infer Condition, infer Members>
    ? Value extends Condition
      ? (members: Members) => void
      : (members: {}) => void
    : never
) extends (members: infer Intersection) => void
  ? Intersection
  : never;

/** The members of the form's extensions on a field of `Values` at `P`. */
export type FieldMembersOf<Fields, Values, P extends string> = MembersFor<Fields, PathValue<Values, P>>;

/** `form.field(path)` and `form.scope(prefix).field(path)` return the base handle plus the members of `fields`. */
type WithFieldMembers<Values, Api, Fields> = Api extends { readonly field: (path: any) => any }
  ? Omit<Api, 'field' | 'scope'> & {
      readonly field: <P extends Path<Values>>(
        path: P,
      ) => FieldHandle<Values, P, ChecksOfApi<Api>> & FieldMembersOf<Fields, Values, P>;
    } & (Api extends { readonly scope: (prefix: any) => any }
        ? {
            readonly scope: <P extends ObjectPath<Values>>(
              prefix: P,
            ) => NoInfer<Scope<NonNullable<PathValue<Values, P>>, ChecksOfApi<Api>, Fields>>;
          }
        : {})
  : Api;

export type Instance<Values, Api, State, Fields> = WithFieldMembers<Values, Api, Fields> & {
  readonly id: string;
  readonly store: ReadonlyStore<State>;
  destroy(): void;
};

/** `Values` is inferred from `schema`. Later options may override `schema` and `defaultValues`. */
export declare function defineForm<Values>(init: {
  readonly name?: string;
  readonly id?: string;
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: NoInfer<Values>;
}): Form<Values>;

/**
 * The keys a `scopes` map cannot use: a key of the form's own values, which the scope would replace, and a dotted key,
 * since a scope is one key and a nested path is `form.scope(path)`.
 */
type ForbiddenScopeKey<Base> = (keyof Base & string) | `${string}.${string}`;

/** With scopes: `schema` and `defaultValues` describe the form's own part, and each scope adds its own. */
export declare function defineForm<Base, const Scopes extends Readonly<Record<string, ScopeDefinition<any>>>>(init: {
  readonly name?: string;
  readonly id?: string;
  readonly schema: StandardSchemaV1<Base>;
  readonly defaultValues: NoInfer<Base>;
  readonly scopes: Scopes & { readonly [Key in keyof Scopes & ForbiddenScopeKey<Base>]: never };
}): Form<Base & ScopedValues<Scopes>>;

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: scopes, reusable pieces of form structure
// ---------------------------------------------------------------------------------------------------------

/** A schema, defaults and validators for a sub-object, without a place. `defineForm({ scopes })` gives it one. */
export interface ScopeDefinition<Values> {
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
  /** Validators per check name. A placed scope's validators run at its path. */
  readonly checks?: { readonly [Check: string]: EventValidators<Values> | undefined };
}

export declare function defineScope<Values>(scope: ScopeDefinition<Values>): ScopeDefinition<Values>;

/** The values a form gains by placing scopes: `{ billing: Address }`. */
export type ScopedValues<Scopes> = {
  readonly [Path in keyof Scopes]: Scopes[Path] extends ScopeDefinition<infer Values> ? Values : never;
};

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: status
// ---------------------------------------------------------------------------------------------------------

export interface FieldStatus {
  readonly dirty: boolean;
  readonly pristine: boolean;
  readonly touched: boolean;
  readonly blurred: boolean;
  readonly valid: boolean;
  /** Deep equality with the default value. `dirty` records interaction and does not clear itself. */
  readonly default: boolean;
}

export interface FormStatus {
  readonly dirty: boolean;
  readonly pristine: boolean;
  readonly touched: boolean;
  readonly blurred: boolean;
  readonly valid: boolean;
  readonly validating: boolean;
  readonly submitting: boolean;
  readonly submits: number;
  readonly submitted: boolean;
  readonly successful: boolean | null;
}

export type FormStatusDefaults = Partial<Pick<FormStatus, 'dirty' | 'submits' | 'successful'>>;
export type FieldStatusDefaults = Partial<Pick<FieldStatus, 'dirty' | 'touched' | 'blurred'>>;

export interface StatusState {
  readonly form: FormStatus;
  readonly fields: Readonly<Record<string, FieldStatus>>;
}

export interface StatusApi<Values> {
  /** Snapshot. Use `useSelector` for a subscription. */
  readonly form: FormStatus;
  at(path: Path<Values>): FieldStatus;
}

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: values and the change pipeline
// ---------------------------------------------------------------------------------------------------------

export type ChangeReason = 'input' | 'programmatic' | 'array' | 'reset' | (string & {});
export type ChangeSource = 'mouse' | 'touch' | 'pen' | 'keyboard' | 'virtual' | 'programmatic' | 'agent';

export interface ChangeDetails {
  readonly reason: ChangeReason;
  readonly source: ChangeSource;
  readonly event?: Event;
  readonly canceled: boolean;
  cancel(): void;
}

export interface Change<Values = unknown> {
  readonly path: Path<Values>;
  readonly value: unknown;
}

/** Return a replacement change, or nothing to keep it. `details.cancel()` refuses the change. */
export type ChangeInterceptor<Values = unknown> = (
  change: Change<Values>,
  details: ChangeDetails,
) => Change<Values> | void;
export type ChangeListener<Values = unknown> = (change: Change<Values>, details: ChangeDetails) => void;

export interface ChangeApi<Values = unknown> {
  /**
   * Runs interceptors, then `write`, then listeners. Called by the behavior that owns the value
   * (`createValues`). Returns false when canceled or when `write` reports no change.
   */
  run(
    change: Change<Values>,
    write: (change: Change<Values>) => boolean,
    details?: Partial<Pick<ChangeDetails, 'reason' | 'source' | 'event'>>,
  ): boolean;
  intercept(interceptor: ChangeInterceptor<Values>): Unsubscribe;
  onChange(listener: ChangeListener<Values>): Unsubscribe;
}

export interface ValuesApi<Values> {
  get(): Values;
  get<P extends Path<Values>>(path: P): PathValue<Values, P>;
  set<P extends Path<Values>>(
    path: P,
    updater: Updater<PathValue<Values, P>>,
    details?: Partial<ChangeDetails>,
  ): boolean;
  intercept(interceptor: ChangeInterceptor<Values>): Unsubscribe;
  onChange(listener: ChangeListener<Values>): Unsubscribe;
}

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: validation and checks
// ---------------------------------------------------------------------------------------------------------

/** A Standard Schema issue. The check adds `type` (the event) itself. */
export type CheckEntry = StandardSchemaV1.Issue & { readonly type?: ValidationEvent };

export interface ValidatorStore<Values> {
  readonly values: Values;
  readonly status: StatusState;
}

export type CheckValidator<Values> =
  | StandardSchemaV1<DeepPartial<Values>>
  | ((store: ValidatorStore<Values>) => StandardSchemaV1<DeepPartial<Values>>);

export type EventValidators<Values> = { readonly [Event in ValidationEvent]?: CheckValidator<Values> };

export type IssuesByCheck<Checks extends string> = { readonly [Check in Checks]: readonly CheckEntry[] };
export type CheckState = Readonly<Record<string, readonly CheckEntry[]>>;
export type SetEntriesMode = 'replace' | 'append' | 'keep';

export interface ValidateOptions {
  readonly type?: ValidationEvent;
}

/** `Checks` lists the registered check names. The form's kind states it. It is not inferred from `createCheck` calls. */
export interface ValidationApi<Values, Checks extends string = string> {
  /** Resolves `[valid, issues]`. `valid` covers this run only. A discarded stale run resolves `[true, {}]`. */
  run(
    targets?: Path<Values> | readonly Path<Values>[],
    options?: ValidateOptions,
  ): Promise<readonly [valid: boolean, issues: IssuesByCheck<Checks>]>;
  /** Observes every completed run, including those started by events and by submit. */
  onRun(listener: (run: ValidationRun<Checks>) => void): Unsubscribe;
  /** Current entries of every registered check, grouped by name, at a path and below. Reads state, never validates. */
  issues(path?: Path<Values>): IssuesByCheck<Checks>;
  /** The registered checks, in registration order. Behaviors that need issues read them here. */
  readonly checks: readonly CheckApi<Values, Checks>[];
  /** True while a run is pending. A snapshot: use `useSelector` for a subscription. */
  readonly validating: boolean;
}

export interface ValidationRun<Checks extends string> {
  readonly targets: readonly string[] | undefined;
  readonly type: ValidationEvent | undefined;
  readonly valid: boolean;
  readonly issues: IssuesByCheck<Checks>;
}

export interface CheckOptions<Name extends string> {
  /** Also the name of the option that supplies the validators, and of the state slice. */
  readonly name: Name;
  readonly blocking?: boolean;
  /** The check's validator replaces every entry in scope, including manual ones. */
  readonly exclusive?: boolean;
}

export interface CheckApi<Values, Name extends string = string> {
  readonly name: Name;
  readonly blocking: boolean;
  at(path: Path<Values>, options?: { readonly nested?: boolean }): readonly CheckEntry[];
  set(path: Path<Values>, entries: readonly CheckEntry[], options?: { readonly mode?: SetEntriesMode }): void;
  /** Removes the entries at a path and below, or every entry without a path. */
  clear(path?: Path<Values>): void;
  /** True when the check has a validator for the event, so a caller can skip a run that would do nothing. */
  validates(event: ValidationEvent): boolean;
}

/**
 * Sugar on a field handle for each check given to `createHandles`: `error()` and `setError(...)`. The entries a
 * `setError` call adds are for errors from outside validation, such as a server's, and go when the field or an
 * ancestor next changes. `check.set` keeps its entries until something clears them.
 */
export type CheckSugar<Checks extends string> = {
  readonly [Check in Checks]: (options?: { readonly nested?: boolean }) => readonly CheckEntry[];
} & {
  readonly [Check in Checks as `set${Capitalize<Check>}`]: (
    entries: readonly CheckEntry[],
    options?: { readonly mode?: SetEntriesMode },
  ) => void;
};

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: field events, arrays, reset, submit and handles
// ---------------------------------------------------------------------------------------------------------

export interface FieldChangeOptions {
  readonly should?: { readonly dirty?: boolean; readonly touch?: boolean; readonly validate?: boolean };
}
export interface FieldFocusOptions {
  readonly should?: { readonly validate?: boolean };
}

export interface EventsApi<Values> {
  change<P extends Path<Values>>(path: P, updater: Updater<PathValue<Values, P>>, options?: FieldChangeOptions): void;
  focus(path: Path<Values>, options?: FieldFocusOptions): void;
  blur(path: Path<Values>, options?: FieldFocusOptions): void;
  register(path: Path<Values>): (element: HTMLElement | null) => void;
  unregister(path: Path<Values>): void;
}

export interface ArrayOperations<Item, Value extends readonly unknown[]> {
  append(item: Item, options?: FieldChangeOptions): void;
  prepend(item: Item, options?: FieldChangeOptions): void;
  insert(index: number, item: Item, options?: FieldChangeOptions): void;
  swap(from: number, to: number, options?: FieldChangeOptions): void;
  move(from: number, to: number, options?: FieldChangeOptions): void;
  update(index: number, item: Updater<Item>, options?: FieldChangeOptions): void;
  /** Always skips validation. */
  remove(index: number, options?: FieldChangeOptions): void;
  replace(items: Updater<Value>, options?: FieldChangeOptions): void;
}

export interface ArraysApi<Values> {
  append<P extends ArrayPath<Values>>(path: P, item: ArrayItem<Values, P>, options?: FieldChangeOptions): void;
  prepend<P extends ArrayPath<Values>>(path: P, item: ArrayItem<Values, P>, options?: FieldChangeOptions): void;
  insert<P extends ArrayPath<Values>>(
    path: P,
    index: number,
    item: ArrayItem<Values, P>,
    options?: FieldChangeOptions,
  ): void;
  swap(path: ArrayPath<Values>, from: number, to: number, options?: FieldChangeOptions): void;
  move(path: ArrayPath<Values>, from: number, to: number, options?: FieldChangeOptions): void;
  update<P extends ArrayPath<Values>>(
    path: P,
    index: number,
    item: Updater<ArrayItem<Values, P>>,
    options?: FieldChangeOptions,
  ): void;
  remove(path: ArrayPath<Values>, index: number, options?: FieldChangeOptions): void;
  replace<P extends ArrayPath<Values>>(
    path: P,
    items: Updater<ArrayValue<Values, P>>,
    options?: FieldChangeOptions,
  ): void;
}

export interface ResetOptions<Values> {
  readonly values?: Values;
  readonly status?: FormStatusDefaults;
  readonly keep?: {
    /** `true` keeps every check's entries, or list check names. */
    readonly checks?: boolean | readonly string[];
    readonly refs?: boolean;
    /** Keeps full field state. Wins over the other flags. */
    readonly fields?: boolean;
  };
}

export interface ResetApi<Values> {
  all(options?: ResetOptions<Values>): void;
  at<P extends Path<Values>>(path: P, options?: { readonly value?: PathValue<Values, P> }): void;
}

export interface SubmitAttempt<Values> {
  readonly values: Values;
  readonly canceled: boolean;
  cancel(): void;
}

export interface SubmitResult<Checks extends string> {
  readonly successful: boolean;
  readonly issues: IssuesByCheck<Checks>;
}

export interface SubmitApi<Values = unknown, Checks extends string = string> {
  /**
   * Calls the `onSubmit` or `onInvalid` option. Resolves after the callback and the status update. The `intent` reaches
   * both: the root passes the `value` of the button that submitted, so two buttons can ask for two actions.
   */
  run(intent?: string): Promise<void>;
  /** Runs before validation. `attempt.cancel()` stops the submit, for example for a confirmation step. */
  intercept(interceptor: (attempt: SubmitAttempt<Values>) => MaybePromise<void>): Unsubscribe;
  onResult(listener: (result: SubmitResult<Checks>) => void): Unsubscribe;
}

export interface FieldState<Value> {
  readonly id: string;
  readonly value: Value;
  readonly defaultValue: Value;
  readonly ref: HTMLElement | null;
  readonly status: FieldStatus;
}

export type FieldHandle<Values, P extends Path<Values>, Checks extends string = never> = {
  readonly state: FieldState<PathValue<Values, P>>;
  get(): PathValue<Values, P>;
  change(updater: Updater<PathValue<Values, P>>, options?: FieldChangeOptions): void;
  focus(options?: FieldFocusOptions): void;
  blur(options?: FieldFocusOptions): void;
  register(element: HTMLElement | null): void;
  unregister(): void;
  reset(options?: { readonly value?: PathValue<Values, P> }): void;
} & CheckSugar<Checks>;

export type ArrayHandle<Values, P extends ArrayPath<Values>> = ArrayOperations<
  ArrayItem<Values, P>,
  ArrayValue<Values, P>
> & {
  get(): ArrayValue<Values, P>;
  /** Stable item ids. They follow items through swap, move and remove. */
  readonly ids: readonly string[];
};

/**
 * Function-typed properties, not methods, so a scope of the wrong shape is rejected. `Fields` adds the field members of
 * the form's extensions at every depth of `scope`. The default adds none, so a function written for
 * `Scope<Address, 'error'>` accepts the scoped handles of any form.
 *
 * The type must be one recursive interface. A recursive alias, a depth counter, written-out levels, or a second
 * interface that is related to `Scope` structurally each make TypeScript fail with "Type instantiation is
 * excessively deep" (found by testing `type-tests/` and the first spike).
 */
export interface Scope<Values, Checks extends string = never, Fields = never> {
  /** Phantom: lets `Instance` read the check names back from an api that has handles. */
  readonly [handlesChecks]?: Checks;
  readonly field: <P extends Path<Values>>(
    path: P,
  ) => FieldHandle<Values, P, Checks> & FieldMembersOf<Fields, Values, P>;
  readonly array: <P extends ArrayPath<Values>>(path: P) => ArrayHandle<Values, P>;
  /** Handles for a sub-object, so a component written for one scope works at any path. */
  readonly scope: <P extends ObjectPath<Values>>(prefix: P) => Scope<NonNullable<PathValue<Values, P>>, Checks, Fields>;
}

/** Subscribes a selector on any instance. Not called on the initial selection. */
export declare function createEffect<State, Selected>(
  instance: { readonly store: ReadonlyStore<State> },
  selector: (state: State) => Selected,
  effect: (selected: Selected) => MaybePromise<void>,
): { unsubscribe(): void };

/** Pure helpers for slot bodies, which read plain state. */
export declare function get<Value, P extends string>(value: Value, path: P): DeepValue<Value, P>;
export declare function idPart(key: string): string;

// ---------------------------------------------------------------------------------------------------------
// @oxform/react
// ---------------------------------------------------------------------------------------------------------

export type ElementTag = keyof JSX.IntrinsicElements;
/** Overrides of the elements the form's slots declare. */
export type PartElements<Parts> = { readonly [Name in keyof Parts]?: ElementTag };

/**
 * A part renders in the element of its tag. `render` renders it in another element instead, or in whatever the
 * function returns. The element or the function gets the part's props, its `ref` included.
 */
export type PartRender<State> =
  | ReactElement
  | ((props: HTMLAttributes<any> & { ref?: Ref<any> }, state: State) => ReactNode);

/** Props go to the element. Children may be a function of the part's state. */
export type PartProps<Tag extends ElementTag, Props = {}, State = {}> = Omit<
  ComponentPropsWithRef<Tag>,
  'children' | keyof Props
> &
  Props & {
    readonly children?: ReactNode | ((state: State) => ReactNode);
    readonly render?: PartRender<State>;
  };

type DefaultElementOf<F, Name extends string> =
  PartsOf<F> extends infer Parts
    ? Name extends keyof Parts
      ? Parts[Name] extends PartSpec<any, any, infer Tag>
        ? Tag
        : never
      : never
    : never;
/** The element a part renders in: the one the caller chose, else the one its slot declares. */
type ElementOf<F, Name extends string, Elements> = Name extends keyof Elements
  ? Elements[Name] extends ElementTag
    ? Elements[Name]
    : DefaultElementOf<F, Name>
  : DefaultElementOf<F, Name>;
type PartNames<F> = Exclude<keyof PartsOf<F> & string, 'root'>;

type PartPropsOf<F, Values, Name extends string> =
  PartsOf<F> extends infer Parts
    ? Name extends keyof Parts
      ? Parts[Name] extends PartSpec<infer Props, any, any>
        ? ResolveKeys<Props, Values>
        : never
      : never
    : never;
type PartStateOf<F, Name extends string> =
  PartsOf<F> extends infer Parts
    ? Name extends keyof Parts
      ? Parts[Name] extends PartSpec<any, infer State, any>
        ? State
        : never
      : never
    : never;

/**
 * A part's component. Given a `scope` (from `useScope` or `form.scope`), the names it takes are paths of the
 * scope's values and name fields inside it, so a block written once for a scope works at any path.
 * Without one, names are paths of the form, as the form's own parts. The two signatures are plain generic
 * signatures on one interface: a mapped type with the scope's values inferred per part runs into "Type
 * instantiation is excessively deep".
 */
export interface PartComponent<F, Name extends string, Tag extends ElementTag> {
  (props: PartProps<Tag, PartPropsOf<F, ValuesOf<F>, Name>, PartStateOf<F, Name>>): JSX.Element;
  <Scoped>(
    props: PartProps<Tag, PartPropsOf<F, Scoped, Name>, PartStateOf<F, Name>> & {
      readonly scope: Scope<Scoped, any, any>;
    },
  ): JSX.Element;
}

export type PartComponents<F, Elements> = {
  readonly [Name in PartNames<F> as Capitalize<Name>]: ElementOf<F, Name, Elements> extends infer Tag extends ElementTag
    ? PartComponent<F, Name, Tag>
    : never;
};

/** The parts of a scope: its names are paths of the scope's values, and no part takes a `scope` prop. */
export type BoundParts<F, Scoped, Elements> = {
  readonly [Name in PartNames<F> as Capitalize<Name>]: ElementOf<F, Name, Elements> extends infer Tag extends ElementTag
    ? (props: PartProps<Tag, PartPropsOf<F, Scoped, Name>, PartStateOf<F, Name>>) => JSX.Element
    : never;
};

/**
 * `Root` takes the form's options as props, and an optional existing instance. Option names shadow DOM props
 * of the same name: `onSubmit` is the option (`(values) => ...`), not the form's DOM event handler.
 */
export type RootProps<F, Tag extends ElementTag> = Omit<ComponentPropsWithRef<Tag>, 'children' | keyof OptionsOf<F>> &
  Partial<OptionsOf<F>> & {
    /** An existing instance, for example one that already ran `validation.run()` on the server. */
    readonly form?: InstanceOf<F>;
    readonly children?: ReactNode;
  };

export type RootComponent<F, Elements> = 'root' extends keyof PartsOf<F>
  ? ElementOf<F, 'root', Elements> extends infer Tag extends ElementTag
    ? { readonly Root: (props: RootProps<F, Tag>) => JSX.Element }
    : {}
  : {};

export interface FormHooks<F, Elements = {}> {
  /**
   * The parts bound to a scope (from `useScope` or `form.scope`): `Field` and the rest need no `scope` prop, so a
   * block written once for a scope takes the bound parts and works at any path and in any form.
   */
  readonly within: <Scoped>(scope: Scope<Scoped, any, any>) => BoundParts<F, Scoped, Elements>;
  /** The instance from context. */
  readonly useForm: () => InstanceOf<F>;
  /** Re-renders when the selected state changes, by `===` or by `compare`. Returns the initial state on the server. */
  readonly useSelector: <Selected>(
    selector: (state: StateOf<F>) => Selected,
    options?: { readonly compare?: (a: Selected, b: Selected) => boolean },
  ) => Selected;
  /**
   * Same signature as `form.field`, and re-renders on that field's state. With `{ scope }` (from `useScope`), the
   * path is relative to the scope and typed by its values.
   */
  readonly useField: (InstanceOf<F> extends { readonly field: infer Field } ? Field : never) &
    (<Scoped, Checks extends string, const P extends Path<Scoped>>(
      path: P,
      options: { readonly scope: Scope<Scoped, Checks, FieldsOf<F>> },
    ) => FieldHandle<Scoped, P, Checks> & FieldMembersOf<FieldsOf<F>, Scoped, P>);
  /** Same signature as `form.array`, and re-renders on that array's state. Takes `{ scope }` like `useField`. */
  readonly useArrayField: (ApiOf<F> extends { readonly array: infer ArrayField } ? ArrayField : never) &
    (<Scoped, const P extends ArrayPath<Scoped>>(
      path: P,
      options: { readonly scope: Scope<Scoped, any, FieldsOf<F>> },
    ) => ArrayHandle<Scoped, P>);
  /**
   * Same signature as `form.scope`. Handles for a sub-object, for components written once per scope. With
   * `{ scope }` the prefix is relative to the scope, so a block can open a scope of its own.
   */
  readonly useScope: ApiOf<F> extends { readonly scope: (prefix: any) => any }
    ? (<const P extends ObjectPath<ValuesOf<F>>>(
        prefix: P,
      ) => Scope<NonNullable<PathValue<ValuesOf<F>, P>>, ChecksOfApi<ApiOf<F>>, FieldsOf<F>>) &
        (<Scoped, Checks extends string, const P extends ObjectPath<Scoped>>(
          prefix: P,
          options: { readonly scope: Scope<Scoped, Checks, FieldsOf<F>> },
        ) => Scope<NonNullable<PathValue<Scoped, P>>, Checks, FieldsOf<F>>)
    : never;
}

export declare function createParts<F extends AnyForm, const Elements extends PartElements<PartsOf<F>> = {}>(
  form: F,
  elements?: Elements,
): PartComponents<F, Elements> & RootComponent<F, Elements> & FormHooks<F, Elements>;

/** A part with another element, or with data-driven content. */
export declare function usePart<
  F extends AnyForm,
  const Name extends keyof PartsOf<F> & string,
  Tag extends ElementTag,
>(
  form: F,
  slot: Name,
  slotProps: PartsOf<F>[Name] extends PartSpec<infer Props, any, any> ? ResolveKeys<Props, ValuesOf<F>> : never,
  props: ComponentPropsWithoutRef<Tag>,
  tag: Tag,
): JSX.Element;
