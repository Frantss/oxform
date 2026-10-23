import type { CreateArrayFieldReturn } from '#types/create-array-field-return';
import type {
  AnyFormApi,
  ArrayFieldOptions,
  ArrayLike,
  FormArrayFields,
  FormFieldValue,
  FormIssueLevels,
} from '@oxform/core';
import type { JSX } from 'solid-js';

export type ArrayFieldProps<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = ArrayFieldOptions<
  Form,
  Name
> & {
  children: (
    array: CreateArrayFieldReturn<Extract<FormFieldValue<Form, Name>, ArrayLike>, FormIssueLevels<Form>>,
  ) => JSX.Element;
};
