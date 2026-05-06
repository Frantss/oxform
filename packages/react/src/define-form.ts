import { useArrayField as useBaseArrayField } from '#use-array-field';
import { useField as useBaseField } from '#use-field';
import { useFieldApi as useBaseFieldApi } from '#use-field-api';
import { useForm as useBaseForm } from '#use-form';
import { type FormApi, type FormArrayFields, type FormFields, type FormOptions } from 'oxform-core';
import { useFormContext as useBaseFormContext } from './form-provider';

export const defineForm = <Values>({ options }: { options: FormOptions<Values> }) => {
  type Form = FormApi<Values>;

  const useForm = () => useBaseForm(options);

  const useFormContext = () => useBaseFormContext(options);

  const useFieldApi = <Name extends FormFields<Form>>(name: Name) => {
    const form = useFormContext();
    return useBaseFieldApi({ form, name });
  };

  const useField = <Name extends FormFields<Form>>(name: Name) => {
    const form = useFormContext();
    return useBaseField({ form, name });
  };

  const useArrayField = <Name extends FormArrayFields<Form>>(name: Name) => {
    const form = useFormContext();
    return useBaseArrayField({ form, name });
  };

  return { useForm, useFormContext, useField, useFieldApi, useArrayField };
};
