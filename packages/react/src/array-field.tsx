import { useArrayField } from '#use-array-field';
import type { ArrayFieldProps } from '#types/array-field-props';
import type { AnyFormApi, ArrayLike, FormArrayFields, FormFieldValue, FormIssueLevels } from '@oxform/core';
import type { UseArrayFieldReturn } from '#types/use-array-field-return';
import { useMemo } from 'react';

type ArrayFieldValue<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = Extract<
  FormFieldValue<Form, Name>,
  ArrayLike
>;

export const ArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>({
  children,
  ...options
}: ArrayFieldProps<Form, Name>) => {
  const field = useArrayField(options as never) as UseArrayFieldReturn<
    ArrayFieldValue<Form, Name>,
    FormIssueLevels<Form>
  >;

  return useMemo(() => {
    return typeof children === 'function' ? children(field) : children;
  }, [children, field]);
};
