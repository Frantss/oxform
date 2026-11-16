import type {
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
import type { FieldMembersOf, ResolveKeys } from '@oxform/core/adapter';
import type { ArrayHandle, FieldHandle } from '@oxform/core/behaviors';
import type { ComponentPropsWithRef, HTMLAttributes, JSX, ReactElement, ReactNode, Ref } from 'react';

/** Overrides of the elements that the slots of a form declare, by slot name. */
export type PartElements<Parts> = { readonly [Name in keyof Parts]?: ElementTag };

/**
 * `render` renders a part in another element: an element, which gets the props of the part, or a function of the
 * props and the state of the part. The props hold the `ref` of the part.
 */
export type PartRender<State> =
  | ReactElement
  | ((props: HTMLAttributes<HTMLElement> & { readonly ref?: Ref<HTMLElement> }, state: State) => ReactNode);

/** The props of a part: those of its element, those of its slot, `children` (content or a function of the state) and `render`. */
export type PartProps<Tag extends ElementTag, Props = {}, State = {}> = Omit<
  ComponentPropsWithRef<Tag>,
  'children' | keyof Props
> &
  Props & {
    readonly children?: ReactNode | ((state: State) => ReactNode);
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
  (
    props: PartProps<Tag, SlotPropsOf<F, Name>, SlotStateOf<F, Name>> & { readonly scope?: undefined },
  ): JSX.Element | null;
  <Scoped, Checks extends string = never, Fields = never>(
    props: PartProps<Tag, SlotPropsOf<F, Name, Scoped>, SlotStateOf<F, Name>> & {
      readonly scope: Scope<Scoped, Checks, Fields>;
    },
  ): JSX.Element | null;
}

/** One component per slot except `root`, named by the capitalized slot name. */
export type PartComponents<F, Elements> = {
  readonly [Name in PartNames<F> as Capitalize<Name>]: PartComponent<F, Name, TagOf<F, Name, Elements> & ElementTag>;
};

type CreateOptionsOf<F> = Partial<OptionsOf<F>>;
type NoOptions<F> = { readonly [Name in keyof OptionsOf<F>]?: never };
/** The DOM props of the element of `Root`: none for a form with no `root` slot. Option names shadow DOM props. */
type RootDomProps<F, Elements> = 'root' extends keyof PartsOf<F>
  ? Omit<ComponentPropsWithRef<TagOf<F, 'root', Elements> & ElementTag>, 'children' | keyof OptionsOf<F>>
  : {};

/**
 * The props of `Root`: the options of the form, or an existing instance in `form` (G12). The instance keeps the
 * options of its owner, so option props beside `form` are a type error.
 */
export type RootProps<F, Elements = {}> = RootDomProps<F, Elements> & { readonly children?: ReactNode } & (
    | (CreateOptionsOf<F> & { readonly form?: never })
    | (NoOptions<F> & { readonly form: InstanceOf<F> })
  );

/** `Root` provides the instance to its parts. With a `root` slot it renders the element of that slot. */
export type RootComponent<F, Elements = {}> = (props: RootProps<F, Elements>) => JSX.Element;

/**
 * The hooks of a form. Each needs a `Root` of the same form object above it, returns a plain value, and renders the
 * component again only when what it reads changes.
 */
export interface FormHooks<F> {
  /** The instance of the nearest `Root`. Throws outside one. */
  readonly useForm: () => InstanceOf<F>;
  /** The selected state. It renders again when the result changes, by `===` or by `compare`. */
  readonly useSelector: <Selected>(
    selector: (state: StateOf<F>) => Selected,
    options?: { readonly compare?: (a: Selected, b: Selected) => boolean },
  ) => Selected;
  /**
   * `form.field`, and it follows the value and the status of that path only. With `{ scope }`, the path is a path
   * of the scope.
   */
  readonly useField: (InstanceOf<F> extends { readonly field: infer Field } ? Field : never) &
    (<Scoped, Checks extends string, const At extends Path<Scoped>>(
      path: At,
      options: { readonly scope: Scope<Scoped, Checks, FieldsOf<F>> },
    ) => FieldHandle<Scoped, At, Checks> & FieldMembersOf<FieldsOf<F>, Scoped, At>);
  /** `form.array`, and it follows the array value. It takes `{ scope }` like `useField`. */
  readonly useArray: (InstanceOf<F> extends { readonly array: infer ArrayField } ? ArrayField : never) &
    (<Scoped, Checks extends string, const At extends ArrayPath<Scoped>>(
      path: At,
      options: { readonly scope: Scope<Scoped, Checks, FieldsOf<F>> },
    ) => ArrayHandle<Scoped, At>);
  /** `form.scope`, the same object for the same inputs. With `{ scope }`, the prefix is a path of the scope. */
  readonly useScope: (InstanceOf<F> extends { readonly scope: infer ScopeOf } ? ScopeOf : never) &
    (<Scoped, Checks extends string, const At extends ObjectPath<Scoped>>(
      prefix: At,
      options: { readonly scope: Scope<Scoped, Checks, FieldsOf<F>> },
    ) => Scope<NonNullable<PathValue<Scoped, At>>, Checks, FieldsOf<F>>);
}
