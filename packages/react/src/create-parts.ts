'use client';

import type { AnyForm, PartsOf } from '@oxform/core';
import { adapterControlsOf, optionKindsOf, slotsOf } from '@oxform/core/adapter';
import { createElement, useEffect, useId, useLayoutEffect, useState, type ReactNode } from 'react';
import { contextOf } from '#context';
import { createHooks } from '#hooks';
import { PartView, type Instance, type PartViewProps, type SlotDefinition } from '#part-view';
import type { FormHooks, PartComponents, PartElements, RootComponent } from '#types';

type FormLike = { create(options?: Record<string, unknown>): Instance };

const capitalize = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/**
 * The React parts of a form: `Root`, and one component per slot. Everything a part does comes from its slot, so
 * the adapter knows no behavior.
 */
export const createParts = (<F extends AnyForm, const Elements extends PartElements<PartsOf<F>> = {}>(
  form: F,
  elements?: Elements,
) => {
  const slots = slotsOf(form) as unknown as Readonly<Record<string, SlotDefinition>>;
  const overrides = (elements ?? {}) as Readonly<Record<string, string>>;
  for (const name of Object.keys(overrides))
    if (!(name in slots)) throw new Error(`oxform: the form has no part "${name}".`);
  const tagOf = (name: string) => overrides[name] ?? slots[name]!.element ?? 'div';
  const optionNames = new Set(Object.keys(optionKindsOf(form)));
  const FormContext = contextOf(form);
  const hooks = createHooks(form);
  const { useForm } = hooks;

  const parts: Record<string, unknown> = {};
  for (const [name, slot] of Object.entries(slots)) {
    if (name === 'root') continue;
    parts[capitalize(name)] = (props: PartViewProps) =>
      createElement(PartView, { instance: useForm(), slot, tag: tagOf(name), props });
  }

  const Root = ({
    form: provided,
    children,
    ...rest
  }: Record<string, unknown> & { form?: Instance; children?: ReactNode }) => {
    const id = useId();
    const options: Record<string, unknown> = { id };
    const domProps: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(rest)) (optionNames.has(name) ? options : domProps)[name] = value;

    const [instance] = useState(() => provided ?? (form as unknown as FormLike).create(options));
    // An instance that `Root` made follows the option props. A given instance keeps the options of its owner.
    const controls = provided ? undefined : adapterControlsOf(instance);
    useLayoutEffect(() => controls?.setOptions(options));
    useEffect(() => () => controls?.unmount(), [controls]);

    const content = slots.root
      ? createElement(PartView, { instance, slot: slots.root, tag: tagOf('root'), props: { ...domProps, children } })
      : children;
    return createElement(FormContext.Provider, { value: instance }, content);
  };

  return { ...parts, Root, ...hooks };
}) as unknown as <F extends AnyForm, const Elements extends PartElements<PartsOf<F>> = {}>(
  form: F,
  elements?: Elements,
) => PartComponents<F, Elements> & { readonly Root: RootComponent<F, Elements> } & FormHooks<F>;
