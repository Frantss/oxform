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
  useSyncExternalStore,
  type ReactNode,
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
const reactEventProp = (event: string) =>
  event === 'input' ? 'onChange' : `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;

const subscribeTo = (instance: Instance) => (notify: () => void) => {
  const subscription = instance.store.subscribe(notify);
  return () => subscription.unsubscribe();
};

function useSelectorOn<Selected>(instance: Instance, selector: (state: any) => Selected) {
  const read = () => selector(instance.store.state);
  return useSyncExternalStore(subscribeTo(instance), read, read);
}

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
  const ref = useCallback(
    (element: HTMLElement | null) =>
      element && bind ? bind(element, { id: instance.id, key, props: partProps, api: instance }) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `partProps` only feeds `bind`, which reads the key
    [bind, instance, key],
  );

  if (slot.present && !slot.present(state, part)) return null;

  const handlers: Record<string, unknown> = {};
  for (const [event, handler] of Object.entries(slot.on ?? {})) {
    const prop = reactEventProp(event);
    handlers[prop] = (reactEvent: { nativeEvent: Event; currentTarget: HTMLElement }) => {
      domProps[prop]?.(reactEvent);
      handler(reactEvent.nativeEvent, { ...part, el: reactEvent.currentTarget });
    };
  }

  const slotState = slot.state?.(state, part) ?? {};
  return createElement(
    tag,
    { ...slot.attrs?.(state, part), ...domProps, ...handlers, ref },
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
    const previous = useRef<any>(null);
    const read = () => {
      const next = handle.state;
      const last = previous.current;
      const same = last && Object.keys(next).every(key => Object.is(next[key], last[key]));
      return same ? last : (previous.current = next);
    };
    useSyncExternalStore(subscribeTo(form), read, read);
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
