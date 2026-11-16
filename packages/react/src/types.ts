import type { ElementTag, InstanceOf, OptionsOf, PartSpec, PartsOf, ValuesOf } from '@oxform/core';
import type { ResolveKeys } from '@oxform/core/adapter';
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

/** The component of one part. Its `'key'` props are paths of the form. */
export interface PartComponent<F, Name extends string, Tag extends ElementTag> {
  (props: PartProps<Tag, SlotPropsOf<F, Name>, SlotStateOf<F, Name>>): JSX.Element | null;
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
