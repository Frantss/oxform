import type { AnyFormApi, FieldOptions, FormFieldExtra, FormFields, FormFieldValue } from 'oxform-core';
import type { UseFieldReturn } from '#types/use-field-return';

export type FieldProps<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldOptions<Form, Name> & {
  children:
    | React.ReactNode
    | ((field: UseFieldReturn<FormFieldValue<Form, Name>, FormFieldExtra<Form, Name>>) => React.ReactNode);
};
