import { useArrayField, type UseArrayFieldReturn } from '#use-array-field';
import type { AnyFormApi, FieldOptions, FormArrayFields, FormFieldValue } from 'oxform-core';
import { useMemo } from 'react';

export type ArrayFieldProps<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = FieldOptions<Form, Name> & {
  children: React.ReactNode | ((field: UseArrayFieldReturn<FormFieldValue<Form, Name>>) => React.ReactNode);
};

export const ArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>({
  children,
  ...options
}: ArrayFieldProps<Form, Name>) => {
  const field = useArrayField(options);

  return useMemo(() => {
    return typeof children === 'function' ? children(field) : children;
  }, [children, field]);
};
