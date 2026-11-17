import { isDeepEqual, joinPath, prefixOf } from '@oxform/core/adapter';
import {
  createMemo,
  createRenderEffect,
  createSignal,
  flush,
  merge,
  omit,
  onCleanup,
  untrack,
  type Accessor,
} from 'solid-js';
import { createComponent, Dynamic, isServer, Show, type JSX } from '@solidjs/web';

export type Instance = {
  readonly id: string;
  readonly store: {
    readonly state: unknown;
    subscribe(listener: (state: unknown) => void): { unsubscribe(): void };
  };
} & Record<string, any>;

type Part = {
  readonly id: string;
  readonly key: string;
  readonly props: Record<string, unknown>;
  readonly api: Instance;
};

/** A slot as the adapter reads it at runtime. */
export type SlotDefinition = {
  readonly element?: string;
  readonly props?: Readonly<Record<string, string>>;
  readonly text?: (state: unknown) => string | undefined;
  readonly present?: (state: unknown, part: Part) => boolean;
  readonly state?: (state: unknown, part: Part) => unknown;
  readonly attrs?: (state: unknown, part: Part) => Readonly<Record<string, unknown>>;
  readonly on?: Readonly<Record<string, (event: Event, context: Part & { readonly element: HTMLElement }) => void>>;
  readonly bind?: (element: HTMLElement, part: Part) => void | (() => void);
};

export type PartViewProps = Record<string, unknown> & {
  readonly children?: JSX.Element | ((state: Accessor<unknown>) => JSX.Element);
  readonly render?: (props: Record<string, unknown>, state: Accessor<unknown>) => JSX.Element;
  readonly ref?: (element: HTMLElement) => void;
  /** A scope, from `useScope` or `form.scope`: the `'key'` props are then paths of the scope. */
  readonly scope?: object;
};

let applying = 0;

/**
 * Applies a store write to the DOM. Solid moves both items of a swapped list, and the browser blurs a focused
 * element that moves. So the focused element gets its focus back, and the events of the update reach no slot.
 */
const applyWrite = (write: () => void) => {
  const focused = document.activeElement;
  applying++;
  try {
    flush(write);
    if (focused instanceof HTMLElement && focused.isConnected && focused !== document.activeElement) focused.focus();
  } finally {
    applying--;
  }
};

/** The state of the store as a signal. On the server it is read once, with no subscription. */
export const storeState = (instance: Instance): Accessor<unknown> => {
  if (isServer) return () => instance.store.state;
  // `ownedWrite`: a store write can come from inside an owner, as the ref or the options of a part.
  const [state, setState] = createSignal(instance.store.state, { equals: false, ownedWrite: true });
  const subscription = instance.store.subscribe(next => applyWrite(() => setState(() => next)));
  onCleanup(() => subscription.unsubscribe());
  return state;
};

type View = { readonly state: unknown; readonly attrs: Readonly<Record<string, unknown>> } | null;

const shallowEqual = (previous: Readonly<Record<string, unknown>>, next: Readonly<Record<string, unknown>>) => {
  const names = Object.keys(previous);
  return names.length === Object.keys(next).length && names.every(name => Object.is(previous[name], next[name]));
};

/** A part updates only when its attributes change, or its state changes by value. */
const sameView = (previous: View, next: View) =>
  previous === next ||
  (!!previous && !!next && shallowEqual(previous.attrs, next.attrs) && isDeepEqual(previous.state, next.state));

/**
 * Solid sets `value` as a property, and a `<select multiple>` takes no list there. For a list, the part selects
 * the options itself, after Solid inserted them.
 */
const selectOptions = (element: HTMLElement | undefined, selected: unknown) => {
  if (!(element instanceof HTMLSelectElement) || !Array.isArray(selected)) return;
  for (const option of element.options) option.selected = selected.includes(option.value);
};

/**
 * One part: the slot's functions become the element's props, its `on` handlers become native listeners, and `bind`
 * runs on the element. It knows no behavior. The props stay a Solid props object, so every read tracks.
 */
export const PartView = (input: {
  readonly instance: Instance;
  readonly slot: SlotDefinition;
  readonly tag: string;
  readonly props: PartViewProps;
}) => {
  const { instance, slot, tag } = input;
  const declared = slot.props ?? {};
  const keyProp = Object.keys(declared).find(name => declared[name] === 'key');
  const local = input.props;
  // The declared props go to the slot only. The slot also reads the DOM props, as `type` and `value`.
  const partProps = omit(local, 'children', 'render', 'ref', 'scope') as Record<string, unknown>;
  const domProps = omit(partProps, ...Object.keys(declared));
  const key = createMemo(
    () => (keyProp === undefined ? '' : joinPath(prefixOf(local.scope), String(partProps[keyProp]))),
    { transparent: true },
  );
  const part = (): Part => ({ id: instance.id, key: key(), props: partProps, api: instance });

  const state = storeState(instance);
  const view = createMemo<View>(
    () => {
      const current = state();
      if (slot.present && !slot.present(current, part())) return null;
      return { state: slot.state?.(current, part()) ?? {}, attrs: slot.attrs?.(current, part()) ?? {} };
    },
    { equals: sameView, transparent: true },
  );
  const partState = () => view()?.state ?? {};
  const listValue = () => view()?.attrs.value;
  const attrs = () => {
    const { value, ...rest } = view()?.attrs ?? {};
    // Solid 2 writes a boolean as presence, and an empty `aria-invalid` means false: an `aria-*` boolean is a string.
    const mapped = Object.fromEntries(
      Object.entries(rest).map(([name, item]) => [
        name,
        name.startsWith('aria-') && typeof item === 'boolean' ? String(item) : item,
      ]),
    );
    // A list goes to the options. With no value, the `value` of the author stays.
    return Array.isArray(value) || value === undefined ? mapped : { ...mapped, value };
  };

  /**
   * The listeners and `bind` of the element of one render. They read the current part at each event. The setup
   * runs in the owner of the render. The ref that it returns runs with no owner, so it only attaches.
   */
  const attachment = () => {
    let element: HTMLElement | undefined;
    let detach = () => {};
    // `transparent`: a computation that only the client makes takes no hydration key.
    if (!isServer) createRenderEffect(listValue, selected => selectOptions(element, selected), { transparent: true });
    onCleanup(() => detach());
    // The ref reads the current part and the author ref once, untracked.
    return (next: HTMLElement) =>
      untrack(() => {
        element = next;
        const removers = Object.entries(slot.on ?? {}).map(([event, handler]) => {
          const listener = (domEvent: Event) => {
            if (applying === 0) handler(domEvent, { ...part(), element: next });
          };
          next.addEventListener(event, listener);
          return () => next.removeEventListener(event, listener);
        });
        const unbind = slot.bind?.(next, part());
        detach = () => {
          if (typeof unbind === 'function') unbind();
          removers.forEach(remove => remove());
        };
        local.ref?.(next);
      });
  };

  const content = () => {
    const children = local.children;
    if (typeof children === 'function') return children(partState);
    return children ?? slot.text?.(partState());
  };

  const element = () => {
    const props = merge(domProps, attrs, {
      ref: attachment(),
      get children() {
        return content();
      },
    });
    if (local.render) return local.render(props, partState);
    return createComponent(Dynamic, merge({ component: tag }, props) as Parameters<typeof Dynamic>[0]);
  };

  // `Show` has a keyed overload, which the inference of `createComponent` picks. The plain one is wanted.
  return createComponent(Show as (props: { when: boolean; children: JSX.Element }) => JSX.Element, {
    get when() {
      return view() !== null;
    },
    get children() {
      return element();
    },
  });
};
