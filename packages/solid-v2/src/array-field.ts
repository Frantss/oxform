import { createArrayField } from '#create-array-field';
import type { ArrayFieldProps } from '#types/array-field-props';
import type { AnyFormApi, FormArrayFields } from '@oxform/core';
import { createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';

export const ArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>(
  props: ArrayFieldProps<Form, Name>,
): JSX.Element => {
  const array = createArrayField<{ form: Form; name: Name }>(() => ({
    form: props.form,
    name: props.name,
  })) as Parameters<ArrayFieldProps<Form, Name>['children']>[0];
  return createMemo(() => props.children(array), { transparent: true }) as unknown as JSX.Element;
};
