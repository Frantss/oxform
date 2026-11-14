'use client';

import { shallow, useSelector } from '@tanstack/react-store';
import type { ReadonlyStore } from '@tanstack/store';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import type * as Api from '../../../api';
import { slotsOf } from '../form';
import { getAt } from '../paths';

type Instance = { readonly id: string; readonly store: ReadonlyStore<any>; destroy(): void } & Record<string, any>;
type Configured = ((options?: Record<string, unknown>) => Instance) & {
  readonly definition: { readonly options: Readonly<Record<string, string>> };
};
type SlotDefinition = {
  readonly props?: Readonly<Record<string, string>>;
  readonly present?: (state: any, part: any) => boolean;
  readonly state?: (state: any, part: any) => unknown;
  readonly attrs?: (state: any, part: any) => Record<string, unknown>;
  readonly on?: Readonly<Record<string, (event: Event, context: any) => void>>;
  readonly bind?: (element: HTMLElement, part: any) => void | (() => void);
};
type PartProps = Record<string, any> & { children?: ReactNode | ((state: any) => ReactNode) };

/** React names the DOM `input` event `onChange`: it is the prop that makes a field with `value` controlled. */
const MULTIWORD_EVENTS = [
  'keydown',
  'keyup',
  'keypress',
  'dblclick',
  'contextmenu',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'pointerover',
  'pointerout',
  'pointercancel',
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',
  'dragstart',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'beforeinput',
  'compositionstart',
  'compositionend',
  'compositionupdate',
];
const EVENT_PROPS: Record<string, string> = {
  input: 'onChange',
  ...Object.fromEntries(
    MULTIWORD_EVENTS.map(event => {
      const [, first, second] = /^(key|mouse|pointer|touch|drag|composition|before|context|dbl)(.+)$/.exec(event)!;
      const cap = (word: string) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
      return [event, `on${cap(first!)}${cap(second!)}`];
    }),
  ),
};
export const reactEventProp = (event: string) =>
  EVENT_PROPS[event] ?? `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;

type RefLike = ((element: HTMLElement | null) => unknown) | { current: unknown } | null | undefined;
const setRef = (ref: RefLike, element: HTMLElement | null) => {
  if (typeof ref === 'function') return ref(element);
  if (ref) ref.current = element;
};

const useSelectorOn = <Selected,>(
  instance: Instance,
  selector: (state: any) => Selected,
  compare?: (a: Selected, b: Selected) => boolean,
) => useSelector(instance.store, selector, { compare });

/** The adapter's whole job for a part: pure slot functions to props, DOM events to handlers, `bind` to a ref. */
function PartView({
  instance,
  slot,
  tag,
  props,
}: {
  instance: Instance;
  slot: SlotDefinition;
  tag: string;
  props: PartProps;
}) {
  const state = useSelectorOn(instance, current => current);
  const { children, ...rest } = props;
  const declared = slot.props ?? {};

  const partProps: Record<string, unknown> = {};
  const domProps: Record<string, any> = {};
  for (const [name, value] of Object.entries(rest)) (name in declared ? partProps : domProps)[name] = value;

  const keyProp = Object.keys(declared).find(name => declared[name] === 'key');
  const part = { id: instance.id, key: keyProp ? String(partProps[keyProp]) : '', props: partProps, api: instance };

  // `bind` runs when the element attaches, and again only if the key or the instance changes.
  const { bind } = slot;
  const { key } = part;
  const authorRef: RefLike = domProps.ref;
  const ref = useCallback(
    (element: HTMLElement | null) => {
      const unbind =
        element && bind ? bind(element, { id: instance.id, key, props: partProps, api: instance }) : undefined;
      const authorCleanup = setRef(authorRef, element);

      // Always a cleanup, so the author's ref and `bind` are undone together on any React version that supports one.
      return () => {
        unbind?.();
        if (typeof authorCleanup === 'function') authorCleanup();
        else setRef(authorRef, null);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `partProps` only feeds `bind`, which reads the key
    [bind, instance, key, authorRef],
  );

  if (slot.present && !slot.present(state, part)) return null;

  const handlers: Record<string, unknown> = {};
  for (const [event, handler] of Object.entries(slot.on ?? {})) {
    const prop = reactEventProp(event);
    handlers[prop] = (reactEvent: SyntheticEvent<HTMLElement>) => {
      // The author's handler runs first, and `preventDefault()` there skips the form's.
      domProps[prop]?.(reactEvent);
      if (reactEvent.isDefaultPrevented()) return;

      handler(reactEvent.nativeEvent, { ...part, el: reactEvent.currentTarget });
      // A slot prevents the native event. React's event must say so too, for a router link or a parent handler.
      if (reactEvent.nativeEvent.defaultPrevented) reactEvent.preventDefault();
    };
  }

  const slotState = slot.state?.(state, part) ?? {};
  return createElement(
    tag,
    { ...domProps, ...slot.attrs?.(state, part), ...handlers, ref },
    typeof children === 'function' ? children(slotState) : children,
  );
}

/**
 * React adapter. The form's slots become components, in the elements the caller chooses, and the form's api
 * becomes hooks. It has no knowledge of any behavior: everything a part does comes from the form's slots.
 */
export const createParts = ((configured: Configured, elements: Record<string, string>) => {
  const slots = slotsOf(configured.definition) as Record<string, SlotDefinition>;
  const FormContext = createContext<Instance | null>(null);

  const useForm = () => {
    const instance = useContext(FormContext);
    if (!instance) throw new Error('oxform: use this inside the form `Root`');
    return instance;
  };

  const components: Record<string, unknown> = {};
  for (const [name, tag] of Object.entries(elements)) {
    const slot = slots[name];
    if (!slot) throw new Error(`oxform: the form has no part "${name}"`);
    if (name === 'root') continue;

    components[`${name.charAt(0).toUpperCase()}${name.slice(1)}`] = (props: PartProps) =>
      createElement(PartView, { instance: useForm(), slot, tag, props });
  }

  if (elements.root) {
    const optionNames = Object.keys(configured.definition.options);
    components.Root = ({ form: provided, children, ...rest }: PartProps & { form?: Instance }) => {
      const id = useId();
      const options: Record<string, unknown> = { id };
      const domProps: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(rest)) (optionNames.includes(name) ? options : domProps)[name] = value;

      const [instance] = useState(() => provided ?? configured(options));

      // Strict mode runs the cleanup and the setup again at once, so destroy only if nothing set the instance up again.
      const mounted = useRef(false);
      useEffect(() => {
        mounted.current = true;
        return () => {
          mounted.current = false;
          if (!provided) queueMicrotask(() => mounted.current || instance.destroy());
        };
      }, [instance, provided]);

      return createElement(
        FormContext.Provider,
        { value: instance },
        createElement(PartView, { instance, slot: slots.root!, tag: elements.root!, props: { ...domProps, children } }),
      );
    };
  }

  // Same signatures as the form's `field`, `array` and `scope`, and they re-render on the state they read.
  const useField = (path: string) => {
    const form = useForm();
    const handle = useMemo(() => form.field(path), [form, path]);
    // The handle's `state` is a new object on each read, so compare its fields.
    useSelectorOn(form, () => handle.state, shallow);
    return handle;
  };

  const useArrayField = (path: string) => {
    const form = useForm();
    useSelectorOn(form, state => getAt(state.values, path));
    return useMemo(() => form.array(path), [form, path]);
  };

  const useScope = (prefix: string) => {
    const form = useForm();
    return useMemo(() => form.scope(prefix), [form, prefix]);
  };

  const useSelector = (selector: (state: any) => unknown) => useSelectorOn(useForm(), selector);

  return { ...components, useForm, useSelector, useField, useArrayField, useScope };
}) as unknown as typeof Api.createParts;
