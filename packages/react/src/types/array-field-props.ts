import type {
  AnyFormApi,
  ArrayLike,
  FieldOptions,
  FormArrayFields,
  FormFieldValue,
  FormIssueLevels,
} from 'oxform-core';
import type { UseArrayFieldReturn } from '#types/use-array-field-return';

type ArrayFieldValue<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = Extract<
  FormFieldValue<Form, Name>,
  ArrayLike
>;

export type ArrayFieldProps<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = FieldOptions<Form, Name> & {
  children:
    | React.ReactNode
    | ((field: UseArrayFieldReturn<ArrayFieldValue<Form, Name>, FormIssueLevels<Form>>) => React.ReactNode);
};
