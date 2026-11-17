import type { AnyForm, ElementTag, PartsOf } from '@oxform/core';
import type { JSX } from '@solidjs/web';
import { merge } from 'solid-js';
import { slotsOfForm, useInstance } from '#context';
import { PartView, type PartViewProps } from '#part-view';
import type { PartProps, SlotPropsOf, SlotStateOf } from '#types';

/**
 * One slot of a form in the element `tag`, inside a `Root` of the same form object. `slotProps` are the props of the
 * slot, and `props` the props of the part for that tag (D32).
 */
export const usePart = (<F extends AnyForm, const Name extends keyof PartsOf<F> & string, Tag extends ElementTag>(
  form: F,
  slot: Name,
  slotProps: SlotPropsOf<F, Name>,
  props: Omit<PartProps<Tag, {}, SlotStateOf<F, Name>>, keyof SlotPropsOf<F, Name>>,
  tag: Tag,
) => {
  const definition = slotsOfForm(form)[slot];
  if (!definition) throw new Error(`oxform: the form has no part "${slot}".`);
  return PartView({
    instance: useInstance(form),
    slot: definition,
    tag,
    props: merge(props, slotProps) as PartViewProps,
  });
}) as <F extends AnyForm, const Name extends keyof PartsOf<F> & string, Tag extends ElementTag>(
  form: F,
  slot: Name,
  slotProps: SlotPropsOf<F, Name>,
  props: Omit<PartProps<Tag, {}, SlotStateOf<F, Name>>, keyof SlotPropsOf<F, Name>>,
  tag: Tag,
) => JSX.Element;
