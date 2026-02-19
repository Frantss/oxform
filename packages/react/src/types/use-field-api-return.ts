import type { FieldApi, AnyFormApi, FormFieldExtra, FormFields, FormFieldValue } from 'oxform-core';

export type UseFieldApiReturn<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldApi<
  FormFieldValue<Form, Name>,
  FormFieldExtra<Form, Name>
>;
