import type { InstanceOf } from '@oxform/core';
import type { profile, signIn } from './fixtures';

export type SignInInstance = InstanceOf<typeof signIn>;
export type ProfileInstance = InstanceOf<typeof profile>;

/**
 * The props that every view gets. `expose` gets the instance of the view's `Root`: the view calls it from a
 * component inside `Root` with the result of `useForm()`. `count` counts a render of a probe: the view calls it
 * where a view below says so.
 */
export type ViewProps = {
  readonly expose: (instance: unknown) => void;
  readonly count: (probe: string) => void;
};

/**
 * The views that each adapter writes in its own JSX, by name. Each entry is the props of the view beyond
 * `ViewProps`, and its doc states the markup. "Field `x`" is the `Field` part with `name="x"`, and "labelled
 * `X`" means wrapped in `<label>X …</label>`. Props of `Root` reach it as props.
 */
export interface Views {
  /**
   * `signIn`. `<Root data-testid="root" {...root}>`, then the Field `email` labelled `Email`, the FieldError
   * `email`, the Field `password` with `type="password"` labelled `Password`, the FieldError `password`, and the
   * Submit with `value="sign-in"` and the text `Sign in`.
   */
  readonly signIn: { readonly root?: Readonly<Record<string, unknown>> };
  /** Two `signIn` views in one tree, each in a `<section aria-label="first">` and `"second"`. */
  readonly twoSignIns: {};
  /** `bare`. `<Root>`, then the Field `name` labelled `Name`. */
  readonly bare: {};
  /**
   * `profile`. `<Root {...root}>`, then, while `show` is not false, the Field `name` labelled `Name`, with the
   * author props `class="author"`, `data-author="yes"` and `id="author-id"`, the ref `ref`, and an `input`
   * handler `onInput`.
   */
  readonly profileName: {
    readonly root?: Readonly<Record<string, unknown>>;
    readonly show?: boolean;
    readonly ref?: (element: HTMLElement | null) => void;
    readonly onInput?: () => void;
  };
  /**
   * `profile`, for the state readers. `<Root>`, then:
   * - the Field `name` labelled `Name` and the Field `email` labelled `Email`, each through `render`, which calls
   *   `count('name part')` or `count('email part')` and renders an `<input>` with the props it gets;
   * - a component that reads `useSelector(state => state.values.name)`, calls `count('selector')`, and renders
   *   `<output aria-label="selected">` with the value;
   * - a component that reads `useField('email')`, calls `count('email field')`, and renders
   *   `<output aria-label="email field">` with `get()`.
   */
  readonly readers: {};
  /**
   * `profile`. `<Root>`, then the Field `name` rendered through `render` as a `<textarea>` labelled `Name`, and
   * `usePart(profile, 'field', { name: 'color' }, {}, 'select')` labelled `Color`, with the options `red` and
   * `blue`.
   */
  readonly otherElements: {};
  /**
   * `profile`. `<Root>`, then, with `scope = useScope('address')` and `geo = useScope('geo', { scope })`: the
   * Field `street` with `scope={scope}` labelled `Street`, the Field `lat` with `scope={geo}` and `type="number"`
   * labelled `Latitude`, the Field `street` with `scope={useForm().scope('address')}` labelled `Street again`,
   * and `<output aria-label="street">` with `useField('street', { scope }).get()`, and
   * `<output aria-label="items">` with `useArray('items', { scope: useForm() }).get().length`.
   */
  readonly scopes: {};
  /**
   * `profile`. `<Root>`, then, for each id of `useArray('items').ids` at index `i`, keyed by the id: the Field
   * `items.${i}.label` labelled `Item ${i}`.
   */
  readonly list: {};
  /**
   * `profile`. `<Root>`, then: the Field `agree` with `type="checkbox"` labelled `Agree`; the Field `plan` with
   * `type="radio"` and `value="free"` labelled `Free`, and with `value="pro"` labelled `Pro`; the Field `color`
   * as a `<select>` labelled `Color` with the options `red` and `blue`; the Field `tags` as a
   * `<select multiple>` labelled `Tags` with the options `a` and `b`; the Field `age` with `type="number"`
   * labelled `Age`; the Field `avatar` with `type="file"` labelled `Avatar`; and the Reset part with the text
   * `Reset`.
   */
  readonly inputs: {};
}

export type ViewName = keyof Views;

/** A mounted view. Disposing it unmounts it and removes its container. */
export interface Mounted<Instance = unknown> extends AsyncDisposable {
  readonly container: HTMLElement;
  /** The instance that the view exposed. */
  readonly instance: Instance;
  /** Renders the view again with new props, as a parent does. Resolves once the DOM is updated. */
  rerender(props: object): Promise<void>;
  /** The renders that the view counted for a probe. */
  renders(probe: string): number;
  unmount(): Promise<void>;
}

export type MountOptions = {
  /** Mounts twice, as React strict mode does. An adapter without strict mode mounts, unmounts and mounts. */
  readonly strict?: boolean;
};

type InstanceOfView<Name extends ViewName> = Name extends 'signIn' | 'twoSignIns'
  ? SignInInstance
  : Name extends 'bare'
    ? unknown
    : ProfileInstance;

/** What an adapter gives the scenarios. */
export interface Driver {
  mount<Name extends ViewName>(
    view: Name,
    props?: Views[Name],
    options?: MountOptions,
  ): Promise<Mounted<InstanceOfView<Name>>>;
  /** The server HTML of the view, and the instance that it exposed during the render. */
  renderToString<Name extends ViewName>(
    view: Name,
    props?: Views[Name],
  ): Promise<{ readonly html: string; readonly instance: InstanceOfView<Name> }>;
  /** Hydrates the server HTML that `container` already holds. */
  hydrate<Name extends ViewName>(
    container: HTMLElement,
    view: Name,
    props?: Views[Name],
  ): Promise<Mounted<InstanceOfView<Name>>>;
}
