import { useField, type UseFieldReturn } from '#use-field';
import type { AnyFormApi, FieldOptions, FormFields, FormFieldValue } from 'oxform-core';
import { useMemo } from 'react';

export type FieldProps<Form extends AnyFormApi, Name extends FormFields<Form>> = FieldOptions<Form, Name> & {
  children: React.ReactNode | ((field: UseFieldReturn<FormFieldValue<Form, Name>>) => React.ReactNode);
};

export const Field = <Form extends AnyFormApi, const Name extends FormFields<Form>>({
  children,
  ...options
}: FieldProps<Form, Name>) => {
  const field = useField(options);

  return useMemo(() => {
    return typeof children === 'function' ? children(field) : children;
  }, [children, field]);
};
