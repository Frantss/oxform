import type { AnyFormApi, FieldApi, FormFields, FormFieldValue } from 'oxform-core';

export type UseFieldApiReturn<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldApi<
  FormFieldValue<Form, Name>
>;
