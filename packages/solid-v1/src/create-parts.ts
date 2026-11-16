import type { AnyForm, PartsOf } from '@oxform/core';
import { adapterControlsOf } from '@oxform/core/adapter';
import { createComputed, createUniqueId, mergeProps, onCleanup, splitProps, type Component, type JSX } from 'solid-js';
import { createComponent } from 'solid-js/web';
import { contextOf, slotsOfForm } from '#context';
import { createHooks } from '#hooks';
import { PartView, type Instance, type PartViewProps } from '#part-view';
import type { FormHooks, PartComponents, PartElements, RootComponent } from '#types';

type FormLike = { create(options?: Record<string, unknown>): Instance };

type RootInput = Record<string, unknown> & {
  readonly form?: Instance;
  readonly options?: Record<string, unknown>;
  readonly children?: JSX.Element;
};

const capitalize = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/**
 * The Solid parts of a form: `Root`, and one component per slot. Everything a part does comes from its slot, so
 * the adapter knows no behavior.
 */
export const createParts = (<F extends AnyForm, const Elements extends PartElements<PartsOf<F>> = {}>(
  form: F,
  elements?: Elements,
) => {
  const slots = slotsOfForm(form);
  const overrides = (elements ?? {}) as Readonly<Record<string, string>>;
  for (const name of Object.keys(overrides))
    if (!(name in slots)) throw new Error(`oxform: the form has no part "${name}".`);
  const tagOf = (name: string) => overrides[name] ?? slots[name]!.element ?? 'div';
  const FormContext = contextOf(form);
  const hooks = createHooks(form);
  const { useForm } = hooks;

  const parts: Record<string, Component<PartViewProps>> = {};
  for (const [name, slot] of Object.entries(slots)) {
    if (name === 'root') continue;
    parts[capitalize(name)] = props => PartView({ instance: useForm(), slot, tag: tagOf(name), props });
  }

  const Root = (props: RootInput) => {
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

  return { ...parts, Root, ...hooks };
}) as unknown as <F extends AnyForm, const Elements extends PartElements<PartsOf<F>> = {}>(
  form: F,
  elements?: Elements,
) => PartComponents<F, Elements> & { readonly Root: RootComponent<F, Elements> } & FormHooks<F>;
