import type { AnyForm } from '@oxform/core';
import { adapterControlsOf } from '@oxform/core/adapter';
import { createComputed, createUniqueId, mergeProps, onCleanup, splitProps, type Component, type JSX } from 'solid-js';
import { createComponent } from 'solid-js/web';
import { contextOf, slotsOfForm, useInstance } from '#context';
import { PartView, type Instance, type PartViewProps } from '#part-view';

type FormLike = { create(options?: Record<string, unknown>): Instance };

type RootProps = Record<string, unknown> & {
  readonly form?: Instance;
  readonly options?: Record<string, unknown>;
  readonly children?: JSX.Element;
};

const capitalize = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/**
 * The Solid parts of a form: `Root`, and one component per slot. Everything a part does comes from its slot, so
 * the adapter knows no behavior.
 */
export const createParts = (form: AnyForm, elements: Readonly<Record<string, string>> = {}) => {
  const slots = slotsOfForm(form);
  for (const name of Object.keys(elements))
    if (!(name in slots)) throw new Error(`oxform: the form has no part "${name}".`);
  const tagOf = (name: string) => elements[name] ?? slots[name]!.element ?? 'div';
  const FormContext = contextOf(form);
  const useForm = () => useInstance(form);

  const parts: Record<string, Component<PartViewProps>> = {};
  for (const [name, slot] of Object.entries(slots)) {
    if (name === 'root') continue;
    parts[capitalize(name)] = props => PartView({ instance: useForm(), slot, tag: tagOf(name), props });
  }

  const Root = (props: RootProps) => {
    const [local, domProps] = splitProps(props, ['form', 'options', 'children']);
    // The id of the framework is hydration-safe. An `id` option of the caller wins.
    const id = createUniqueId();
    const options = () => ({ id, ...local.options });

    const instance = local.form ?? (form as unknown as FormLike).create(options());
    // An instance that `Root` made follows `options`. A given instance keeps the options of its owner.
    const controls = local.form ? undefined : adapterControlsOf(instance);
    if (controls) {
      createComputed(() => controls.setOptions(options()));
      onCleanup(() => controls.unmount());
    }

    return createComponent(FormContext.Provider, {
      value: instance,
      get children() {
        if (!slots.root) return local.children;
        const rootProps = mergeProps(domProps, {
          get children() {
            return local.children;
          },
        }) as PartViewProps;
        return PartView({ instance, slot: slots.root, tag: tagOf('root'), props: rootProps });
      },
    });
  };

  return { ...parts, Root, useForm } as Record<string, Component<any>> & {
    readonly Root: Component<RootProps>;
    readonly useForm: () => any;
  };
};
