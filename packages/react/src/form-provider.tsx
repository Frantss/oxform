import type { AnyFormApi, FormApi, FormOptions } from '@oxform/core';
import { createContext, createElement, useContext, useMemo } from 'react';

const FormContext = createContext<AnyFormApi[]>([]);

export function FormProvider({ form, children }: { form: AnyFormApi; children: React.ReactNode }): React.ReactElement {
  const context = useContext(FormContext);
  const value = useMemo(() => [form].concat(context), [context, form]);

  return createElement(FormContext.Provider, { value }, children);
}

export const useFormContext = <Values = unknown, Level extends string = string>({
  id,
}: { id?: string } | FormOptions<Values, Level> = {}) => {
  const context = useContext(FormContext);

  if (!context) throw new Error('Missing <FormProvider />');

  const form = id ? context.find(form => form.id === id) : context[0];

  if (!form) throw new Error('Form not found.');

  return form as FormApi<Values, Level>;
};
