// SPIKE: public types and signatures only. Nothing here is implemented. Every value is `declare`d.
//
// One file stands in for three entry points, marked by banners:
//   @oxform/core            kernel: defineForm, configureForm, extendForm, context, create* behaviors
//   @oxform/core/standard   standardForm, a preset built only from the kernel's public types
//   @oxform/react           createParts, usePart
//
// Typing model, checked with tsc 7.0.2 in a scratch project (see the report, not this file):
//   - A form's types depend on `Values`, which is known only when `configureForm` sees the schema.
//     TypeScript cannot carry that through a generic function value, so a definition is typed by a
//     `FormKind`: a type that maps `Values` to the form's options, state, api and parts (higher-kinded
//     encoding with `this['values']`).
//   - `configureForm` infers `Values` from the `schema` option, then checks every other option against it.
//   - So `defineForm` and `extendForm` take the kind as a type argument. It is not inferred from the
//     implementation. An extension whose types do not depend on `Values` can skip it.

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ReadonlyStore } from '@tanstack/store';
import type { ComponentPropsWithoutRef, JSX, ReactNode } from 'react';
import type { DeepKeys, DeepKeysOfType, DeepValue } from '../../packages/core/src/types/deep';

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

/** How an adapter passes an option. It does not give the option a TypeScript type. */
export type OptionKind = 'string' | 'number' | 'boolean' | 'list' | 'value' | 'callback' | 'action' | 'id' | 'key';
/** The declared kinds must cover exactly the keys of the options type. */
export type OptionKinds<Options> = { readonly [Name in keyof Options]-?: OptionKind };

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: form kinds
// ---------------------------------------------------------------------------------------------------------

/**
 * Maps `Values` to everything about a form that depends on it. Declare one with an interface and
 * `this['values']`, then read it with `OptionsOf`, `StateOf`, `ApiOf` and `PartsOf`.
 */
export interface FormKind {
  readonly values: unknown;
  readonly options: unknown;
  readonly state: unknown;
  readonly api: unknown;
  readonly parts: unknown;
  /** Input for `fieldExtras`: the path of a field handle. */
  readonly path: unknown;
  /** The base field handle, typed by `values` and `path`. Leave `unknown` for forms without field handles. */
  readonly handle: unknown;
  /** Extra members on every field handle, typed by `values` and `path`. Leave `unknown` for none. */
  readonly fieldExtras: unknown;
  /** The check names of the form, a string union such as `'error' | 'warning'`. Scoped handles carry their sugar. Leave `unknown` for none. */
  readonly checks: unknown;
}

/** The check names a kind states, or `never`. */
export type ChecksOf<Kind extends FormKind> = Kind['checks'] extends string ? Kind['checks'] : never;

type Apply<Kind extends FormKind, Values> = Kind & { readonly values: Values };
export type OptionsOf<Kind extends FormKind, Values> = Apply<Kind, Values>['options'];
export type StateOf<Kind extends FormKind, Values> = Apply<Kind, Values>['state'];
export type ApiOf<Kind extends FormKind, Values> = Apply<Kind, Values>['api'];
export type PartsOf<Kind extends FormKind, Values> = Apply<Kind, Values>['parts'];
export type FieldHandleOf<Kind extends FormKind, Values, P> = (Kind & {
  readonly values: Values;
  readonly path: P;
})['handle'];
export type FieldExtrasOf<Kind extends FormKind, Values, P> = (Kind & {
  readonly values: Values;
  readonly path: P;
})['fieldExtras'];

/** Merges an extension kind into a base kind. Options, state, api and parts are intersected. */
export interface ExtendedKind<Base extends FormKind, Extension extends FormKind> extends FormKind {
  readonly options: OptionsOf<Base, this['values']> & OptionsOf<Extension, this['values']>;
  readonly state: StateOf<Base, this['values']> & StateOf<Extension, this['values']>;
  readonly api: ApiOf<Base, this['values']> & ApiOf<Extension, this['values']>;
  readonly parts: PartsOf<Base, this['values']> & PartsOf<Extension, this['values']>;
  readonly handle: FieldHandleOf<Base, this['values'], this['path']>;
  readonly fieldExtras: FieldExtrasOf<Base, this['values'], this['path']> &
    FieldExtrasOf<Extension, this['values'], this['path']>;
  readonly checks: ChecksOf<Base> | ChecksOf<Extension>;
}

/** An extension that does not depend on `Values`: only an api. */
export interface PlainKind<Api extends object> extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: Api;
  readonly parts: {};
}

export declare const formKind: unique symbol;

/** Stateless and shareable. It has no `Values` yet, so it cannot create an instance. */
export interface FormDefinition<Kind extends FormKind> {
  readonly [formKind]: Kind;
  readonly name: string;
  readonly options: Readonly<Record<string, OptionKind>>;
}

/** A definition with `Values` fixed. Calling it creates an instance. Later options win over earlier ones. */
export interface ConfiguredForm<Kind extends FormKind, Values> {
  (options?: Partial<OptionsOf<Kind, Values>>): FormInstance<Kind, Values>;
  readonly definition: FormDefinition<Kind>;
}

/**
 * Handles for a sub-object, with the extras that extensions declare in `fieldExtras`. The extras are typed from the
 * sub-object's own values at every depth of `scope`, and `path` is relative to the scope. It is `HandlesApi` with the
 * form's kind, so a function written for one fragment still accepts it.
 *
 * The type must be one recursive interface. A recursive alias, a depth counter, written-out levels, or a second
 * interface that is related to `HandlesApi` structurally each make TypeScript fail with "Type instantiation is
 * excessively deep" (found by testing `type-tests/` and the spike).
 */
export type ScopedHandles<Kind extends FormKind, Values, Checks extends string = never> = HandlesApi<
  Values,
  Checks,
  Kind
>;

/** `form.field(path)` and `form.scope(prefix).field(path)` return the base handle plus the extras of `fieldExtras`. */
type WithFieldExtras<Kind extends FormKind, Values> =
  ApiOf<Kind, Values> extends { readonly field: (path: any) => any }
    ? Omit<ApiOf<Kind, Values>, 'field' | 'scope'> & {
        readonly field: <P extends Path<Values>>(
          path: P,
        ) => FieldHandleOf<Kind, Values, P> & FieldExtrasOf<Kind, Values, P>;
      } & (ApiOf<Kind, Values> extends { readonly scope: (prefix: any) => any }
          ? {
              readonly scope: <P extends ObjectPath<Values>>(
                prefix: P,
              ) => NoInfer<ScopedHandles<Kind, NonNullable<PathValue<Values, P>>, ChecksOf<Kind>>>;
            }
          : {})
    : ApiOf<Kind, Values>;

export type FormInstance<Kind extends FormKind, Values> = WithFieldExtras<Kind, Values> & {
  readonly id: string;
  readonly store: ReadonlyStore<StateOf<Kind, Values>>;
  destroy(): void;
};

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: parts
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

/** The props type of a part, derived from its `props` declaration: `{ name: 'key' }` gives `{ name: string }`. */
export type PropsOf<Spec> = {
  readonly [Name in keyof Spec]: Spec[Name] extends PropKind ? PropType<Spec[Name]> : never;
};

/** What a part declares for a kind: its props and the state its children can read. */
export interface PartSpec<Props = {}, State = {}> {
  readonly props: Props;
  readonly state: State;
}

export interface PartHandle<Props, Api> {
  readonly id: string;
  readonly key: string;
  readonly props: Props;
  readonly api: Api;
}

export interface PartEventContext<Props, Api> extends PartHandle<Props, Api> {
  readonly el: HTMLElement | null;
}

export type Attributes = Readonly<Record<string, string | number | boolean | undefined>>;

/** `attrs`, `state` and `present` are pure: they run on the server. DOM work goes in `bind`. */
export interface SlotDefinition<Spec, SlotState, Api, State> {
  readonly props?: Spec;
  present?(state: State, part: PartHandle<PropsOf<Spec>, Api>): boolean;
  state?(state: State, part: PartHandle<PropsOf<Spec>, Api>): SlotState;
  attrs?(state: State, part: PartHandle<PropsOf<Spec>, Api>): Attributes;
  readonly on?: {
    readonly [Event in keyof HTMLElementEventMap]?: (
      event: HTMLElementEventMap[Event],
      context: PartEventContext<PropsOf<Spec>, Api>,
    ) => void;
  };
  bind?(element: HTMLElement, part: PartHandle<PropsOf<Spec>, Api>): void | (() => void);
}

declare const slotBrand: unique symbol;
export interface Slot<Props = {}, SlotState = {}> {
  readonly [slotBrand]: PartSpec<Props, SlotState>;
}

/** No explicit generics: `Spec` comes from `props`, and `SlotState` from the `state` function. */
export type SlotFactory<Api, State> = <const Spec extends Readonly<Record<string, PropKind>> = {}, SlotState = {}>(
  definition: SlotDefinition<Spec, SlotState, Api, State>,
) => Slot<PropsOf<Spec>, SlotState>;

export type SlotMap<Parts> = {
  readonly [Name in keyof Parts]: Parts[Name] extends PartSpec<infer Props, infer SlotState>
    ? Slot<Props, SlotState>
    : never;
};

export type SlotRecord = Readonly<Record<string, Slot<any, any>>>;

/**
 * A reusable group of slots. Annotate the `slot` parameter with what the slots need (`SlotFactory<Api, State>`).
 * A form uses it by spreading it into `slots`, and it fails to compile if the form lacks that api or state.
 */
export declare function defineSlots<Api, State, Slots extends SlotRecord>(
  build: (slot: SlotFactory<Api, State>) => Slots,
): (slot: SlotFactory<Api, State>) => Slots;

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: defining, extending and configuring forms
// ---------------------------------------------------------------------------------------------------------

export interface FormContext<Options = unknown, State = unknown> {
  /** Read inside methods, never keep the result, so values stay current. */
  options(): Options;
  onOptions(listener: (options: Options, previous: Options) => void): Unsubscribe;
  /** Runs when the adapter destroys the instance. Nothing needs it on a server render. */
  onDestroy(cleanup: () => void): void;
  /** The instance under construction. Call it from event handlers, never inside `api`, where it is incomplete. */
  instance<Instance = unknown>(): Instance;
  /** Registers a state slice. Call it inside `api`. */
  slice<Slice>(name: string, initial: Slice): StateSlice<Slice>;
  readonly store: ReadonlyStore<State>;
}

export interface StateSlice<Slice> {
  get(): Slice;
  set(next: Slice | ((current: Slice) => Slice)): void;
}

export interface DefineFormInput<Kind extends FormKind> {
  readonly name: string;
  readonly options: OptionKinds<OptionsOf<Kind, any>>;
  /** Runs once per instance, on the server too. It must be inert: no DOM, no timers, no requests. */
  api(ctx: FormContext<OptionsOf<Kind, any>, StateOf<Kind, any>>): ApiOf<Kind, any>;
  slots?(slot: SlotFactory<ApiOf<Kind, any>, StateOf<Kind, any>>): SlotMap<PartsOf<Kind, any>>;
}

export declare function defineForm<Kind extends FormKind>(input: DefineFormInput<Kind>): FormDefinition<Kind>;

/** `api` and `slots` return only the additions. The result merges them with the base. */
export interface ExtendFormInput<Base extends FormKind, Extension extends FormKind> {
  readonly name: string;
  readonly options?: OptionKinds<OptionsOf<Extension, any>>;
  api(
    ctx: FormContext<OptionsOf<ExtendedKind<Base, Extension>, any>, StateOf<ExtendedKind<Base, Extension>, any>>,
    base: ApiOf<Base, any>,
  ): ApiOf<Extension, any>;
  slots?(
    slot: SlotFactory<ApiOf<ExtendedKind<Base, Extension>, any>, StateOf<ExtendedKind<Base, Extension>, any>>,
    base: SlotMap<PartsOf<Base, any>>,
  ): SlotMap<PartsOf<Extension, any>>;
  /** Members for every `form.field(path)` handle, typed by the extension kind's `fieldExtras`. See `ExtensionInput`. */
  fieldExtras?(path: string, field: FieldHandle<any, any, any>): FieldExtrasOf<Extension, any, any>;
}

/**
 * The extension kind is explicit when its types depend on `Values` or it adds options. Without a type
 * argument `Extension` is `never`, this overload rejects the call, and the api-only overload below applies.
 */
export declare function extendForm<Base extends FormKind, Extension extends FormKind = never>(
  definition: FormDefinition<Base>,
  input: ExtendFormInput<Base, Extension>,
): FormDefinition<ExtendedKind<Base, Extension>>;

/** An api-only extension: `Additions` is inferred from the returned object. */
export declare function extendForm<Base extends FormKind, Additions extends object>(
  definition: FormDefinition<Base>,
  input: {
    readonly name: string;
    api(ctx: FormContext, base: ApiOf<Base, any>): Additions;
  },
): FormDefinition<ExtendedKind<Base, PlainKind<Additions>>>;

/** A base satisfies `Needs` when its api has at least those members. */
export type Requires<Base extends FormKind, Needs> = ApiOf<Base, any> extends Needs ? unknown : never;

export interface ExtensionInput<Needs, Kind extends FormKind> {
  readonly name: string;
  readonly options?: OptionKinds<OptionsOf<Kind, any>>;
  /** `base` has only what `Needs` states, so the extension works on any form that provides it. */
  api(ctx: FormContext<OptionsOf<Kind, any>, StateOf<Kind, any>>, base: Needs): ApiOf<Kind, any>;
  slots?(slot: SlotFactory<Needs & ApiOf<Kind, any>, StateOf<Kind, any>>): SlotMap<PartsOf<Kind, any>>;
  /**
   * Members for every `form.field(path)` handle, typed by the kind's `fieldExtras`. `field` is the base handle, so
   * the extras can read its live `state` and call its methods. The extension must state a `field` in `Needs`, since
   * the form needs a `field(path)` api to extend. Scoped handles (`form.scope(prefix).field(path)`) get the extras
   * too, with `path` relative to the scope, typed at every depth of `scope` (see `ScopedHandles`).
   */
  fieldExtras?(path: string, field: FieldHandle<any, any, any>): FieldExtrasOf<Kind, any, any>;
}

export type Extension<Needs, Kind extends FormKind> = <Base extends FormKind>(
  definition: FormDefinition<Base> & Requires<Base, Needs>,
) => FormDefinition<ExtendedKind<Base, Kind>>;

/**
 * The packaging unit of a reusable behavior: options, kind, api and slots in one object. Applying it to a
 * form that lacks what `Needs` states is a type error.
 */
export declare function defineExtension<Needs, Kind extends FormKind>(
  input: ExtensionInput<Needs, Kind>,
): Extension<Needs, Kind>;

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: fragments, reusable pieces of form structure
// ---------------------------------------------------------------------------------------------------------

/** A schema, defaults and validators for a sub-object, without a place. Mounting gives it one. */
export interface FragmentDefinition<Values> {
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
  /** Validators per check name. A mounted fragment's validators run at the mount path. */
  readonly checks?: { readonly [Check: string]: EventValidators<Values> | undefined };
}

export declare function defineFragment<Values>(fragment: FragmentDefinition<Values>): FragmentDefinition<Values>;

/** The values a form gains by mounting fragments: `{ billing: Address }`. */
export type MountedValues<Fragments> = {
  readonly [Mount in keyof Fragments]: Fragments[Mount] extends FragmentDefinition<infer Values> ? Values : never;
};

/** With fragments: `schema` and `defaultValues` describe the form's own part, and each mount adds its own. */
export declare function configureForm<
  Kind extends FormKind,
  Base,
  const Fragments extends Readonly<Record<string, FragmentDefinition<any>>>,
>(
  definition: FormDefinition<Kind>,
  options: {
    readonly schema: StandardSchemaV1<Base>;
    readonly defaultValues: NoInfer<Base>;
    readonly fragments: Fragments;
  } & Omit<Partial<OptionsOf<Kind, NoInfer<Base & MountedValues<Fragments>>>>, 'schema' | 'defaultValues'>,
): ConfiguredForm<Kind, Base & MountedValues<Fragments>>;

/**
 * `Values` is inferred from `schema`. Every other option is then checked against it, so `defaultValues`,
 * callbacks and validators are typed. Options may also be given later, to the instance or to `Root`.
 */
export declare function configureForm<Kind extends FormKind, Values>(
  definition: FormDefinition<Kind>,
  options: { readonly schema: StandardSchemaV1<Values> } & Partial<OptionsOf<Kind, NoInfer<Values>>>,
): ConfiguredForm<Kind, Values>;

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

/** Sugar on a field handle for each check given to `createHandles`: `error()` and `setError(...)`. */
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
  /** Calls the `onSubmit` or `onInvalid` option. Resolves after the callback and the status update. */
  run(): Promise<void>;
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
 * Function-typed properties, not methods, so a scope of the wrong shape is rejected. `Kind` adds the field extras of
 * the form's extensions at every depth of `scope`. The default kind adds none, so a function written for
 * `HandlesApi<Address, 'error'>` accepts the scoped handles of any form.
 */
export interface HandlesApi<Values, Checks extends string = never, Kind extends FormKind = FormKind> {
  readonly field: <P extends Path<Values>>(path: P) => FieldHandle<Values, P, Checks> & FieldExtrasOf<Kind, Values, P>;
  readonly array: <P extends ArrayPath<Values>>(path: P) => ArrayHandle<Values, P>;
  /** Handles for a sub-object, so a component written for one fragment works at any mount point. */
  readonly scope: <P extends ObjectPath<Values>>(
    prefix: P,
  ) => HandlesApi<NonNullable<PathValue<Values, P>>, Checks, Kind>;
}

// ---------------------------------------------------------------------------------------------------------
// @oxform/core: behaviors. Dependencies are plain arguments.
// `Checks` is stated by the caller. A check registers itself with `validation` at runtime, not in the types.
// ---------------------------------------------------------------------------------------------------------

export declare function createContext<Options>(options: Options): FormContext<Options>;

export declare function createChange<Values = unknown>(ctx: FormContext): ChangeApi<Values>;

export declare function createValues<Values>(
  ctx: FormContext<{ readonly defaultValues: Values }>,
  deps: { readonly change: ChangeApi<Values> },
): ValuesApi<Values>;

/** Validation needs no `schema` option: the schema only gives the form its data shape. Checks hold the validators. */
export declare function createValidation<Values, Checks extends string = string>(
  ctx: FormContext,
  deps: { readonly values: ValuesApi<Values> },
): ValidationApi<Values, Checks>;

export declare function createCheck<Values, Name extends string>(
  ctx: FormContext,
  deps: { readonly values: ValuesApi<Values>; readonly validation: ValidationApi<Values> },
  options: CheckOptions<Name>,
): CheckApi<Values, Name>;

export declare function createFieldStatus<Values>(
  ctx: FormContext<
    | {
        readonly defaultStatus?: FormStatusDefaults;
        readonly defaultFieldStatus?: Partial<Record<Path<Values> | '*', FieldStatusDefaults>>;
      }
    | {}
  >,
  /** `values` feeds the field `default` flag. `validation` feeds `valid` and `validating`. */
  deps: { readonly values?: ValuesApi<Values>; readonly validation?: ValidationApi<Values> },
): StatusApi<Values>;

export declare function createFieldEvents<Values>(
  ctx: FormContext,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly validation?: ValidationApi<Values>;
  },
): EventsApi<Values>;

export declare function createArray<Values>(
  ctx: FormContext,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly validation?: ValidationApi<Values>;
  },
): ArraysApi<Values>;

export declare function createReset<Values>(
  ctx: FormContext<{ readonly defaultValues: Values }>,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly validation?: ValidationApi<Values>;
    /** Needed to clear refs. Without it, `keep.refs` has no effect. */
    readonly events?: EventsApi<Values>;
  },
): ResetApi<Values>;

export declare function createSubmit<Values, Checks extends string = string, Instance = unknown>(
  ctx: FormContext<
    | {
        readonly onSubmit?: (values: Values, form: Instance) => MaybePromise<unknown>;
        readonly onInvalid?: (issues: IssuesByCheck<Checks>, form: Instance) => MaybePromise<unknown>;
      }
    | {}
  >,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly validation?: ValidationApi<Values, Checks>;
    readonly status: StatusApi<Values>;
  },
): SubmitApi<Values, Checks>;

export declare function createHandles<Values, Checks extends Readonly<Record<string, CheckApi<Values>>>>(
  ctx: FormContext,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly events: EventsApi<Values>;
    readonly reset: ResetApi<Values>;
    readonly arrays: ArraysApi<Values>;
    readonly checks: Checks;
  },
): HandlesApi<Values, Extract<keyof Checks, string>>;

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
// @oxform/core/standard: the suggested preset
// ---------------------------------------------------------------------------------------------------------

export interface StandardOptions<Values> {
  readonly id?: string;
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: NoInfer<Values>;
  /** Validators of the `error` check, per event. The root `schema` does not validate: it only sets the data shape. */
  readonly error?: EventValidators<NoInfer<Values>>;
  readonly defaultStatus?: FormStatusDefaults;
  readonly defaultFieldStatus?: Partial<Record<Path<Values> | '*', FieldStatusDefaults>>;
  readonly onSubmit?: (values: Values, form: FormInstance<StandardKind, Values>) => MaybePromise<unknown>;
  readonly onInvalid?: (
    issues: IssuesByCheck<'error'>,
    form: FormInstance<StandardKind, Values>,
  ) => MaybePromise<unknown>;
}

export interface StandardState<Values> {
  readonly values: Values;
  readonly status: StatusState;
  readonly error: CheckState;
}

export interface StandardApi<Values> {
  readonly values: ValuesApi<Values>;
  readonly error: CheckApi<Values, 'error'>;
  readonly status: StatusApi<Values>;
  readonly validation: ValidationApi<Values, 'error'>;
  readonly events: EventsApi<Values>;
  readonly arrays: ArraysApi<Values>;
  readonly reset: ResetApi<Values>;
  readonly submit: SubmitApi<Values, 'error'>;
  readonly field: HandlesApi<Values, 'error'>['field'];
  readonly array: HandlesApi<Values, 'error'>['array'];
  readonly scope: HandlesApi<Values, 'error'>['scope'];
}

export interface SubmitPartState {
  readonly submitting: boolean;
  readonly submits: number;
  readonly successful: boolean | null;
}

export interface StandardParts<Values> {
  readonly root: PartSpec;
  readonly field: PartSpec<{ readonly name: Path<Values> }>;
  readonly fieldError: PartSpec<{ readonly name: Path<Values> }, { readonly messages: readonly string[] }>;
  readonly submit: PartSpec<{}, SubmitPartState>;
  readonly reset: PartSpec;
}

export interface StandardKind extends FormKind {
  readonly options: StandardOptions<this['values']>;
  readonly state: StandardState<this['values']>;
  readonly api: StandardApi<this['values']>;
  readonly parts: StandardParts<this['values']>;
  readonly handle: StandardHandle<this['values'], this['path']>;
  readonly checks: 'error';
}

export type StandardHandle<Values, P> = P extends Path<Values> ? FieldHandle<Values, P, 'error'> : never;

export declare const standardForm: FormDefinition<StandardKind>;

// ---------------------------------------------------------------------------------------------------------
// @oxform/react
// ---------------------------------------------------------------------------------------------------------

export type ElementTag = keyof JSX.IntrinsicElements;
export type PartElements<Parts> = { readonly [Name in keyof Parts]?: ElementTag };

/** Props go to the element. Children may be a function of the part's state. */
export type PartProps<Tag extends ElementTag, Props = {}, State = {}> = Omit<
  ComponentPropsWithoutRef<Tag>,
  'children' | keyof Props
> &
  Props & { readonly children?: ReactNode | ((state: State) => ReactNode) };

export type PartComponents<Parts, Elements> = {
  readonly [
    Name in Exclude<keyof Parts & keyof Elements & string, 'root'> as Capitalize<Name>
  ]: Elements[Name] extends ElementTag
    ? Parts[Name] extends PartSpec<infer Props, infer State>
      ? (props: PartProps<Elements[Name], Props, State>) => JSX.Element
      : never
    : never;
};

/**
 * `Root` takes the form's options as props, and an optional existing instance. Option names shadow DOM props
 * of the same name: `onSubmit` is the option (`(values) => ...`), not the form's DOM event handler.
 */
export type RootProps<Kind extends FormKind, Values, Tag extends ElementTag> = Omit<
  ComponentPropsWithoutRef<Tag>,
  'children' | keyof OptionsOf<Kind, Values>
> &
  Partial<OptionsOf<Kind, Values>> & {
    /** An existing instance, for example one that already ran `validation.run()` on the server. */
    readonly form?: FormInstance<Kind, Values>;
    readonly children?: ReactNode;
  };

export type RootComponent<Kind extends FormKind, Values, Elements> = Elements extends {
  readonly root: infer Tag extends ElementTag;
}
  ? { readonly Root: (props: RootProps<Kind, Values, Tag>) => JSX.Element }
  : {};

export interface FormHooks<Kind extends FormKind, Values> {
  /** The instance from context. */
  useForm(): FormInstance<Kind, Values>;
  /** Re-renders when the selected state changes. Returns the initial state on the server. */
  useSelector<Selected>(selector: (state: StateOf<Kind, Values>) => Selected): Selected;
  /** Same signature as `form.field`, and re-renders on that field's state. */
  useField: ApiOf<Kind, Values> extends { readonly field: infer Field } ? Field : never;
  /** Same signature as `form.array`, and re-renders on that array's state. */
  useArrayField: ApiOf<Kind, Values> extends { readonly array: infer ArrayField } ? ArrayField : never;
  /** Same signature as `form.scope`. Handles for a sub-object, for components written once per fragment. */
  useScope: ApiOf<Kind, Values> extends { readonly scope: infer Scope } ? Scope : never;
}

export declare function createParts<
  Kind extends FormKind,
  Values,
  const Elements extends PartElements<PartsOf<Kind, Values>>,
>(
  form: ConfiguredForm<Kind, Values>,
  elements: Elements,
): PartComponents<PartsOf<Kind, Values>, Elements> & RootComponent<Kind, Values, Elements> & FormHooks<Kind, Values>;

/** A part with another element, or with data-driven content. */
export declare function usePart<
  Kind extends FormKind,
  Values,
  const Slot extends keyof PartsOf<Kind, Values> & string,
  Tag extends ElementTag,
>(
  form: ConfiguredForm<Kind, Values>,
  slot: Slot,
  slotProps: PartsOf<Kind, Values>[Slot] extends PartSpec<infer Props, any> ? Props : never,
  props: ComponentPropsWithoutRef<Tag>,
  tag: Tag,
): JSX.Element;
