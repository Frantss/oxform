import type {
  ApiOf,
  ArrayPath,
  ElementTag,
  FieldsOf,
  InstanceOf,
  ObjectPath,
  OptionsOf,
  PartSpec,
  PartsOf,
  Path,
  PathValue,
  Scope,
  StateOf,
  ValuesOf,
} from '@oxform/core';
import type { ChecksOfApi, FieldMembersOf, ResolveKeys } from '@oxform/core/adapter';
import type { ArrayHandle, FieldHandle } from '@oxform/core/behaviors';
import type { ComponentProps, JSX } from '@solidjs/web';
import type { Accessor } from 'solid-js';

/** Overrides of the elements that the slots of a form declare, by slot name. */
export type PartElements<Parts> = { readonly [Name in keyof Parts]?: ElementTag };

/**
 * `render` renders a part in another element: a function of the props and the state of the part, called once. The
 * props hold the `ref` of the part. A Solid element is a DOM node, so it cannot take new props (`01#6.3`).
 */
export type PartRender<State> = (
  // `any`: the props spread onto whichever element the function renders.
  props: JSX.HTMLAttributes<any> & { readonly ref?: (element: any) => void },
  state: Accessor<State>,
) => JSX.Element;

/**
 * The props of a part: those of its element, those of its slot, `children` (content or a function of the state)
 * and `render`. Read them through the props object, without destructuring: Solid props are getters.
 */
export type PartProps<Tag extends ElementTag, Props = {}, State = {}> = Omit<
  ComponentProps<Tag>,
  'children' | keyof Props
> &
  Props & {
    readonly children?: JSX.Element | ((state: Accessor<State>) => JSX.Element);
    readonly render?: PartRender<State>;
  };

type SpecOf<F, Name> = Name extends keyof PartsOf<F> ? PartsOf<F>[Name] : never;
type DefaultTagOf<F, Name> = SpecOf<F, Name> extends PartSpec<any, any, infer Tag> ? Tag : never;
/** The element of a part: the one that the caller of `createParts` chose, else the one that its slot declares. */
export type TagOf<F, Name, Elements> = Name extends keyof Elements
  ? Elements[Name] extends ElementTag
    ? Elements[Name]
    : DefaultTagOf<F, Name>
  : DefaultTagOf<F, Name>;
export type SlotPropsOf<F, Name, Values = ValuesOf<F>> =
  SpecOf<F, Name> extends PartSpec<infer Props, any, any> ? ResolveKeys<Props, Values> : never;
export type SlotStateOf<F, Name> = SpecOf<F, Name> extends PartSpec<any, infer State, any> ? State : never;
type PartNames<F> = Exclude<keyof PartsOf<F> & string, 'root'>;

/**
 * The component of one part. Its `'key'` props are paths of the form, or, with a `scope` (from `useScope` or
 * `form.scope`), paths of the scope. The two signatures are overloads: a mapped type that infers the values of the
 * scope per part is too deep for TypeScript.
 */
export interface PartComponent<F, Name extends string, Tag extends ElementTag> {
  (props: PartProps<Tag, SlotPropsOf<F, Name>, SlotStateOf<F, Name>> & { readonly scope?: undefined }): JSX.Element;
  <Scoped, Checks extends string = never, Fields = never>(
    props: PartProps<Tag, SlotPropsOf<F, Name, Scoped>, SlotStateOf<F, Name>> & {
      readonly scope: Scope<Scoped, Checks, Fields>;
    },
  ): JSX.Element;
}

/** One component per slot except `root`, named by the capitalized slot name. */
export type PartComponents<F, Elements> = {
  readonly [Name in PartNames<F> as Capitalize<Name>]: PartComponent<F, Name, TagOf<F, Name, Elements> & ElementTag>;
};

/** The DOM props of the element of `Root`: none for a form with no `root` slot. */
type RootDomProps<F, Elements> = 'root' extends keyof PartsOf<F>
  ? Omit<ComponentProps<TagOf<F, 'root', Elements> & ElementTag>, 'children' | 'form'>
  : {};

/**
 * The props of `Root`: the DOM props of its element, and the options of the form in `options`, or an existing
 * instance in `form` (G12). The instance keeps the options of its owner, so `options` beside `form` is a type error.
 */
export type RootProps<F, Elements = {}> = RootDomProps<F, Elements> & { readonly children?: JSX.Element } & (
    | { readonly options?: Partial<OptionsOf<F>>; readonly form?: never }
    | { readonly options?: never; readonly form: InstanceOf<F> }
  );

/** `Root` provides the instance to its parts. With a `root` slot it renders the element of that slot. */
export type RootComponent<F, Elements = {}> = (props: RootProps<F, Elements>) => JSX.Element;

type Values<F> = ValuesOf<F>;
type Checks<F> = ChecksOfApi<ApiOf<F>>;
/** A path, or an accessor of a path that the hook follows (`01#6.3`). */
type PathInput<At> = At | Accessor<At>;
type ScopeOption<Scoped, ScopeChecks extends string, F> = { readonly scope: Scope<Scoped, ScopeChecks, FieldsOf<F>> };
type HasHandles<F> = InstanceOf<F> extends { readonly field: unknown } ? true : false;

/**
 * The hooks of a form. Each needs a `Root` of the same form object above it, and an owner. A Solid component runs
 * once, so `useSelector` returns an accessor, and the handles of `useField` and `useArray` track their reads.
 */
export interface FormHooks<F> {
  /** The instance of the nearest `Root`. Throws outside one. */
  readonly useForm: () => InstanceOf<F>;
  /** The selected state, as an accessor. It updates when the result changes, by `===` or by `compare`. */
  readonly useSelector: <Selected>(
    selector: (state: StateOf<F>) => Selected,
    options?: { readonly compare?: (a: Selected, b: Selected) => boolean },
  ) => Accessor<Selected>;
  /**
   * `form.field`. `state` and `get()` track the value and the status of that path in a reactive scope. With
   * `{ scope }`, the path is a path of the scope.
   */
  readonly useField: HasHandles<F> extends true
    ? {
        <const At extends Path<Values<F>>>(
          path: PathInput<At>,
        ): FieldHandle<Values<F>, At, Checks<F>> & FieldMembersOf<FieldsOf<F>, Values<F>, At>;
        <Scoped, ScopeChecks extends string, const At extends Path<Scoped>>(
          path: PathInput<At>,
          options: ScopeOption<Scoped, ScopeChecks, F>,
        ): FieldHandle<Scoped, At, ScopeChecks> & FieldMembersOf<FieldsOf<F>, Scoped, At>;
      }
    : never;
  /** `form.array`. `get()` and `ids` track the array value. It takes `{ scope }` like `useField`. */
  readonly useArray: HasHandles<F> extends true
    ? {
        <const At extends ArrayPath<Values<F>>>(path: PathInput<At>): ArrayHandle<Values<F>, At>;
        <Scoped, ScopeChecks extends string, const At extends ArrayPath<Scoped>>(
          path: PathInput<At>,
          options: ScopeOption<Scoped, ScopeChecks, F>,
        ): ArrayHandle<Scoped, At>;
      }
    : never;
  /** `form.scope`. With `{ scope }`, the prefix is a path of the scope. */
  readonly useScope: HasHandles<F> extends true
    ? {
        <const At extends ObjectPath<Values<F>>>(
          prefix: PathInput<At>,
        ): Scope<NonNullable<PathValue<Values<F>, At>>, Checks<F>, FieldsOf<F>>;
        <Scoped, ScopeChecks extends string, const At extends ObjectPath<Scoped>>(
          prefix: PathInput<At>,
          options: ScopeOption<Scoped, ScopeChecks, F>,
        ): Scope<NonNullable<PathValue<Scoped, At>>, ScopeChecks, FieldsOf<F>>;
      }
    : never;
}
