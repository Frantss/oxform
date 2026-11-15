'use client';

import { shallow, useSelector } from '@tanstack/react-store';
import type { ReadonlyStore } from '@tanstack/store';
import {
  cloneElement,
  createContext,
  createElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type * as Api from '../../../api';
import { adapterControlsOf, slotsOf } from '../form';
import { prefixOf } from '../handles';
import { getAt, isDeepEqual, joinPath } from '../paths';

type Instance = { readonly id: string; readonly store: ReadonlyStore<any> } & Record<string, any>;
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
type RefLike = ((element: HTMLElement | null) => unknown) | { current: unknown } | null | undefined;
type Render = ReactElement | ((props: Record<string, unknown>, state: any) => ReactNode);
type PartProps = Record<string, any> & {
  children?: ReactNode | ((state: any) => ReactNode);
  render?: Render;
  scope?: object;
};

const setRef = (ref: RefLike, element: HTMLElement | null) => {
  if (typeof ref === 'function') return ref(element);
  if (ref) ref.current = element;
};

/** The ref the author put on the element given to `render`. */
const elementRef = (render: unknown): RefLike =>
  isValidElement(render) ? (render.props as { ref?: RefLike }).ref : undefined;

/** Both refs get the element, and both are let go together. */
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

/**
 * What a part shows is a function of the store's state alone: `null` while the part is absent. The selector returns
 * a small object, and the part re-renders only when that object changes by value.
 */
const sameView = (previous: any, next: any) =>
  previous === next ||
  (!!previous && !!next && shallow(previous.attrs, next.attrs) && isDeepEqual(previous.state, next.state));

/** The adapter's job for a part: slot functions to props, DOM events to listeners, `bind` to the element's ref. */
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
  const { children, render, scope, ref: authorRef, ...rest } = props;
  const declared = slot.props ?? {};

  const partProps: Record<string, unknown> = {};
  const domProps: Record<string, any> = {};
  for (const [name, value] of Object.entries(rest)) (name in declared ? partProps : domProps)[name] = value;

  const keyProp = Object.keys(declared).find(name => declared[name] === 'key');
  // A part given a `scope` names its field relative to it.
  const key = keyProp ? joinPath(prefixOf(scope), String(partProps[keyProp])) : '';

  const view = useSelector(
    instance.store,
    state => {
      const part = { id: instance.id, key, props: partProps, api: instance };
      if (slot.present && !slot.present(state, part)) return null;
      return { state: slot.state?.(state, part) ?? {}, attrs: slot.attrs?.(state, part) ?? {} };
    },
    { compare: sameView },
  );

  // Listeners and `bind` attach to the element once. They read the part's props from here, as of the last commit.
  const latestProps = useRef(partProps);
  useLayoutEffect(() => {
    latestProps.current = partProps;
  });

  const attach = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const part = () => ({ id: instance.id, key, props: latestProps.current, api: instance });

      const removers = Object.entries(slot.on ?? {}).map(([event, handler]) => {
        const listener = (domEvent: Event) => handler(domEvent, { ...part(), el: element });
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

  const own = elementRef(render);
  // oxlint-disable-next-line react/refs -- this builds a ref callback from ref callbacks, and reads no `current`
  const ref = useMemo(() => mergeRefs(attach, authorRef, own), [attach, authorRef, own]);

  if (!view) return null;

  const content = typeof children === 'function' ? children(view.state) : children;
  const elementProps = { ...domProps, ...view.attrs, ref };

  if (typeof render === 'function') return render({ ...elementProps, children: content }, view.state);
  if (isValidElement(render)) return cloneElement(render, elementProps, content ?? (render.props as any).children);
  return createElement(tag, elementProps, content);
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

      // The options of an instance we made follow the props. An instance we were given keeps its owner's.
      const controls = provided ? undefined : adapterControlsOf(instance);
      useLayoutEffect(() => controls?.setOptions(options));
      useEffect(() => () => controls?.unmount(), [controls]);

      return createElement(
        FormContext.Provider,
        { value: instance },
        createElement(PartView, { instance, slot: slots.root!, tag: elements.root!, props: { ...domProps, children } }),
      );
    };
  }

  // Same signatures as the form's `field`, `array` and `scope`, and each takes `{ scope }` to read relative to one.
  // Each re-renders on the state it reads, and no more.
  type Scoped = { readonly scope?: object };
  const handlesOf = (form: Instance, options?: Scoped) => (options?.scope ?? form) as Instance;
  const fullPath = (path: string, options?: Scoped) => joinPath(prefixOf(options?.scope), path);

  const useField = (path: string, options?: Scoped) => {
    const form = useForm();
    const scope = options?.scope;
    const handle = useMemo(() => handlesOf(form, { scope }).field(path), [form, scope, path]);
    const full = fullPath(path, { scope });
    useSelector(form.store, state => [getAt(state.values, full), state.status.fields[full]], { compare: shallow });
    return handle;
  };

  const useArrayField = (path: string, options?: Scoped) => {
    const form = useForm();
    const scope = options?.scope;
    const full = fullPath(path, { scope });
    useSelector(form.store, state => getAt(state.values, full));
    return useMemo(() => handlesOf(form, { scope }).array(path), [form, scope, path]);
  };

  const useScope = (prefix: string, options?: Scoped) => {
    const form = useForm();
    const scope = options?.scope;
    return useMemo(() => handlesOf(form, { scope }).scope(prefix), [form, scope, prefix]);
  };

  const useFormSelector = (selector: (state: any) => unknown, options?: { compare?: (a: any, b: any) => boolean }) =>
    useSelector(useForm().store, selector, options);

  return { ...components, useForm, useSelector: useFormSelector, useField, useArrayField, useScope };
}) as unknown as typeof Api.createParts;
