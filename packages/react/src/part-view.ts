import { shallow, useSelector } from '@tanstack/react-store';
import { isDeepEqual, joinPath, prefixOf } from '@oxform/core/adapter';
import type { ReadonlyStore } from '@tanstack/react-store';
import {
  cloneElement,
  createElement,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

export type Instance = { readonly id: string; readonly store: ReadonlyStore<any> } & Record<string, any>;

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
  readonly children?: ReactNode | ((state: unknown) => ReactNode);
  readonly render?: unknown;
  readonly ref?: RefLike;
  /** A scope, from `useScope` or `form.scope`: the `'key'` props are then paths of the scope. */
  readonly scope?: object;
};

type RefLike = ((element: HTMLElement | null) => unknown) | { current: unknown } | null | undefined;

/** The React names of the HTML attributes whose names differ (G18). */
const reactNames: Readonly<Record<string, string>> = {
  for: 'htmlFor',
  class: 'className',
  readonly: 'readOnly',
  tabindex: 'tabIndex',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  novalidate: 'noValidate',
  formnovalidate: 'formNoValidate',
  inputmode: 'inputMode',
  enterkeyhint: 'enterKeyHint',
  contenteditable: 'contentEditable',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
};

const toReactProps = (attrs: Readonly<Record<string, unknown>>) =>
  Object.fromEntries(Object.entries(attrs).map(([name, value]) => [reactNames[name] ?? name, value]));

const ignoreChange = () => {};

const setRef = (ref: RefLike, element: HTMLElement | null) => {
  if (typeof ref === 'function') return ref(element);
  if (ref) ref.current = element;
};

/** All refs get the element, and all are let go together. */
const mergeRefs =
  (...refs: RefLike[]) =>
  (element: HTMLElement | null) => {
    const cleanups = refs.map(ref => setRef(ref, element));
    return () =>
      refs.forEach((ref, index) => {
        const cleanup = cleanups[index];
        if (typeof cleanup === 'function') cleanup();
        else setRef(ref, null);
      });
  };

type View = { readonly state: unknown; readonly attrs: Readonly<Record<string, unknown>> } | null;

/** A part renders again only when its attributes change, or its state changes by value. */
const sameView = (previous: View, next: View) =>
  previous === next ||
  (!!previous && !!next && shallow(previous.attrs, next.attrs) && isDeepEqual(previous.state, next.state));

/**
 * One part: the slot's functions become the element's props, its `on` handlers become native listeners, and `bind`
 * runs on the element. It knows no behavior.
 */
export const PartView = ({
  instance,
  slot,
  tag,
  props,
}: {
  readonly instance: Instance;
  readonly slot: SlotDefinition;
  readonly tag: string;
  readonly props: PartViewProps;
}) => {
  const { children, render, ref: authorRef, scope, ...rest } = props;
  const declared = slot.props ?? {};
  const keyProp = Object.keys(declared).find(name => declared[name] === 'key');
  const key = keyProp === undefined ? '' : joinPath(prefixOf(scope), String(rest[keyProp]));
  // The declared props go to the slot only. The slot also reads the DOM props, as `type` and `value`.
  const domProps = Object.fromEntries(Object.entries(rest).filter(([name]) => !(name in declared)));

  const view = useSelector(
    instance.store,
    state => {
      const part = { id: instance.id, key, props: rest, api: instance };
      if (slot.present && !slot.present(state, part)) return null;
      return { state: slot.state?.(state, part) ?? {}, attrs: slot.attrs?.(state, part) ?? {} };
    },
    { compare: sameView },
  );

  // The listeners attach once per element. They read the props of the last commit.
  const latestProps = useRef(rest);
  useLayoutEffect(() => {
    latestProps.current = rest;
  });

  const attach = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const part = () => ({ id: instance.id, key, props: latestProps.current, api: instance });
      const removers = Object.entries(slot.on ?? {}).map(([event, handler]) => {
        const listener = (domEvent: Event) => handler(domEvent, { ...part(), element });
        element.addEventListener(event, listener);
        return () => element.removeEventListener(event, listener);
      });
      const unbind = slot.bind?.(element, part());
      return () => {
        unbind?.();
        removers.forEach(remove => remove());
      };
    },
    [slot, instance, key],
  );

  const renderRef = isValidElement(render) ? (render.props as { ref?: RefLike }).ref : undefined;
  // oxlint-disable-next-line react/refs -- this builds a ref callback from ref callbacks, and reads no `current`.
  const ref = useMemo(() => mergeRefs(attach, authorRef, renderRef), [attach, authorRef, renderRef]);

  if (!view) return null;

  const content = typeof children === 'function' ? children(view.state) : (children ?? slot.text?.(view.state));
  const attrs = toReactProps(view.attrs);
  // The slot's listeners write the value, so the `onChange` of React has nothing to do. The author's own stays.
  const controlled = attrs.value !== undefined || attrs.checked !== undefined;
  const elementProps = { ...(controlled && { onChange: ignoreChange }), ...domProps, ...attrs, ref };

  if (typeof render === 'function') return render({ ...elementProps, children: content }, view.state) as ReactNode;
  if (isValidElement(render))
    return cloneElement(render, elementProps, content ?? (render.props as { children?: ReactNode }).children);
  return createElement(tag, elementProps, content);
};
