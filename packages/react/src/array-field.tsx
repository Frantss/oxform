import { useArrayField } from '#use-array-field';
import type { ArrayFieldProps } from '#types/array-field-props';
import type { AnyFormApi, FormArrayFields } from 'oxform-core';
import { useMemo } from 'react';

export const ArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>({
  children,
  ...options
}: ArrayFieldProps<Form, Name>) => {
  const field = useArrayField(options);

  return useMemo(() => {
    return typeof children === 'function' ? children(field) : children;
  }, [children, field]);
};
