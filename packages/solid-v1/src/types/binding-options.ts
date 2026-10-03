import type { AnyFormApi, FormArrayFields, FormFields } from 'oxform-core';

export type BindingInput = { form: AnyFormApi; name: string };
export type FieldBindingOptions<Options extends BindingInput> = Options & {
  name: NoInfer<FormFields<Options['form']>>;
};
export type ArrayBindingOptions<Options extends BindingInput> = Options & {
  name: NoInfer<FormArrayFields<Options['form']>>;
};
