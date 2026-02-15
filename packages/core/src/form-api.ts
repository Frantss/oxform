import { defaultStatus } from '#field-api.constants';
import type { FormOptions, FormResetOptions, FormSubmitErrorHandler, FormSubmitSuccessHandler } from '#form-api.types';
import { FormArrayFieldApi } from '#form-array-field-api';
import { FormField } from '#form-field-api';
import { FormContextApi } from '#form/form-core';
import type { DeepKeys, DeepKeysOfType, DeepValue } from '#more-types';
import type { ArrayLike, StandardSchema } from '#types';

export type AnyFormApi = FormApi<any>;

export type FormValues<Form extends AnyFormApi> = Form extends FormApi<infer Values> ? Values : never;
export type FormFields<Form extends AnyFormApi> = DeepKeys<FormValues<Form>>;
export type FormArrayFields<Form extends AnyFormApi> = DeepKeysOfType<FormValues<Form>, ArrayLike>;
export type FormFieldValue<Form extends AnyFormApi, Name extends FormFields<Form>> = DeepValue<FormValues<Form>, Name>;

export class FormApi<Values> {
  private context: FormContextApi<Values>;
  public field: FormField<Values>;
  public array: FormArrayFieldApi<Values>;

  constructor(options: FormOptions<Values>) {
    // todo: add form id to options

    this.context = new FormContextApi(options);
    this.field = new FormField(this.context);
    this.array = new FormArrayFieldApi({ field: this.field, context: this.context });
  }

  public '~mount' = () => {
    const unsubscribe = this.context.store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FormOptions<Values>) => {
    this.context.options = options;
  };

  public store = () => {
    return this.context.store;
  };

  public status = () => {
    return this.context.store.state.status;
  };

  public values = () => {
    return this.context.store.state.values;
  };

  public options = () => {
    return this.context.options;
  };

  public get validate() {
    return this.context.validate;
  }

  public submit =
    (
      onSuccess: FormSubmitSuccessHandler<StandardSchema<Values>>,
      onError?: FormSubmitErrorHandler<StandardSchema<Values>>,
    ) =>
    async () => {
      this.context.setStatus({ submitting: true, dirty: true });

      const issues = await this.context.validate(undefined, { type: 'submit' });
      const valid = issues.length === 0;

      if (valid) {
        await onSuccess(this.context.store.state.values as never, this as never);
      } else {
        await onError?.(issues, this as never);
      }

      this.context.setStatus({
        submits: this.context.persisted.state.status.submits + 1,
        submitting: false,
        successful: valid,
      });
    };

  public reset = (options?: FormResetOptions<Values>) => {
    this.context.persisted.setState(current => {
      return {
        values: options?.values ?? this.context.options.defaultValues,
        fields: options?.keep?.fields ? current.fields : {},
        refs: options?.keep?.refs ? current.refs : {},
        errors: options?.keep?.errors ? current.errors : {},
        status: {
          ...defaultStatus,
          ...options?.status,
        },
      };
    });
  };
}
