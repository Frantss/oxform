import { useArrayField, type UseArrayFieldReturn } from '#use-array-field';
import type { DeepKeysOfType, DeepValue, FieldOptions } from 'oxform-core';
import type { StandardSchema } from 'oxform-core/schema';
import { useMemo } from 'react';

export type ArrayFieldProps<
  Schema extends StandardSchema,
  Name extends DeepKeysOfType<StandardSchema.InferInput<Schema>, any[] | null | undefined>,
> = FieldOptions<Schema, Name> & {
  children:
    | React.ReactNode
    | ((
        field: UseArrayFieldReturn<Schema, Name, DeepValue<StandardSchema.InferInput<Schema>, Name>>,
      ) => React.ReactNode);
};

export const ArrayField = <
  Schema extends StandardSchema,
  Name extends DeepKeysOfType<StandardSchema.InferInput<Schema>, any[] | null | undefined>,
>({
  children,
  ...options
}: ArrayFieldProps<Schema, Name>) => {
  const field = useArrayField(options);

  return useMemo(() => {
    return typeof children === 'function' ? children(field) : children;
  }, [children, field]);
};
