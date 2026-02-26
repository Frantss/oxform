import type { FieldProps } from '#types/field-props';
import { useField } from '#use-field';
import type { AnyFormApi, FormFields } from 'oxform-core';
import { useMemo } from 'react';

export const Field = <Form extends AnyFormApi, const Name extends FormFields<Form>>({
  children,
  ...options
}: FieldProps<Form, Name>) => {
  const field = useField(options);

  return useMemo(() => {
    return typeof children === 'function' ? children(field) : children;
  }, [children, field]);
};
