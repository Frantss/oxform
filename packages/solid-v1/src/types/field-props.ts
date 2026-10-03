import type { CreateFieldReturn } from '#types/create-field-return';
import type { AnyFormApi, FieldOptions, FormFields, FormFieldValue, FormIssueLevels } from 'oxform-core';
import type { JSX } from 'solid-js';

export type FieldProps<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldOptions<Form, Name> & {
  children: (field: CreateFieldReturn<FormFieldValue<Form, Name>, FormIssueLevels<Form>>) => JSX.Element;
};
