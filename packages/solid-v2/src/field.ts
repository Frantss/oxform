import { createField } from '#create-field';
import type { FieldProps } from '#types/field-props';
import type { AnyFormApi, FormFields } from '@oxform/core';
import { createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';

export const Field = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  props: FieldProps<Form, Name>,
): JSX.Element => {
  const field = createField<{ form: Form; name: Name }>(() => ({ form: props.form, name: props.name })) as Parameters<
    FieldProps<Form, Name>['children']
  >[0];
  return createMemo(() => props.children(field), { transparent: true }) as unknown as JSX.Element;
};
