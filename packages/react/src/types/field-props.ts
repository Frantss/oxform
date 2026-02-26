import type { UseFieldReturn } from '#types/use-field-return';
import type { AnyFormApi, FieldOptions, FormFields, FormFieldValue } from 'oxform-core';

export type FieldProps<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldOptions<Form, Name> & {
  children: React.ReactNode | ((field: UseFieldReturn<FormFieldValue<Form, Name>>) => React.ReactNode);
};
