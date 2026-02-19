import { FormCore } from '#form/form-core';
import { FormCoreArray } from '#form/form-core-array-field';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import type { FormOptions } from '#types/api/form-options';
import type { FormSubmitErrorHandler } from '#types/api/form-submit-error-handler';
import type { FormSubmitSuccessHandler } from '#types/api/form-submit-success-handler';
import type { FormWithOptions } from '#types/api/form-with-options';

export class FormApi<Values, With extends FormWithOptions<Values> = any> {
  private core!: FormCore<Values>;
  public field: FormCoreField<Values>;
  public array: FormCoreArray<Values>;

  constructor(options: FormOptions<Values, With>) {
    this.core = new FormCore<Values>(options);
    const fields = new FormCoreFields<Values>({ core: this.core });

    this.field = new FormCoreField<Values>({ core: this.core, fields });
    this.array = new FormCoreArray<Values>({
      core: this.core,
      fields,
      field: this.field,
    });
  }

  public get options() {
    return this.core.options;
  }

  public get store() {
    return this.core.store;
  }

  public get status() {
    return this.core.store.state.status;
  }

  public get values() {
    return this.core.store.state.values;
  }

  public get validate() {
    return this.core.validate;
  }

  public get reset() {
    return this.core.reset;
  }

  public '~mount' = () => {
    return this.core.store.mount();
  };

  public '~update' = (options: FormOptions<Values, With>) => {
    this.core.options = options;
  };

  public submit = (
    onSuccess: FormSubmitSuccessHandler<Values>,
    onError?: FormSubmitErrorHandler<Values>,
  ): (() => Promise<void>) => {
    return async () => {
      this.core.persisted.setState(state => {
        return {
          ...state,
          status: {
            ...state.status,
            dirty: true,
            submitting: true,
          },
        };
      });

      const [valid, issues] = await this.core.validate(undefined, {
        type: 'submit',
      });

      if (valid) await onSuccess(this.core.store.state.values, this);
      else await onError?.(issues, this);

      this.core.persisted.setState(state => {
        return {
          ...state,
          status: {
            ...state.status,
            submits: state.status.submits + 1,
            submitting: false,
            successful: valid,
          },
        };
      });
    };
  };
}
