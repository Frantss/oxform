import { FormCore } from '#form/form-core';
import { FormCoreArray } from '#form/form-core-array-field';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import type { FormOptions } from '#types/api/form-options';
import type { FormSubmitErrorHandler } from '#types/api/form-submit-error-handler';
import type { FormSubmitSuccessHandler } from '#types/api/form-submit-success-handler';
import { generateId } from '#utils/generate-id';

export class FormApi<Values, Level extends string = string> {
  private core!: FormCore<Values, Level>;
  private submission: Promise<void> | undefined;
  public id: string;
  public field: FormCoreField<Values, Level>;
  public array: FormCoreArray<Values, Level>;

  constructor(options: FormOptions<Values, Level>) {
    this.id = options.id ?? generateId();
    this.core = new FormCore<Values, Level>(options);
    const fields = new FormCoreFields<Values, Level>({ core: this.core });

    this.field = new FormCoreField<Values, Level>({ core: this.core, fields });
    this.array = new FormCoreArray<Values, Level>({
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

  public get state() {
    return this.core.store.state;
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

  public get issues() {
    return this.core.issues;
  }

  public get setIssues() {
    return this.core.setIssues;
  }

  public '~mount' = () => {
    return () => {};
  };

  public '~update' = (options: FormOptions<Values, Level>) => {
    this.core.updateOptions(options);
  };

  public submit = (
    onSuccess: FormSubmitSuccessHandler<Values, Level>,
    onError?: FormSubmitErrorHandler<Values, Level>,
  ): (() => Promise<void>) => {
    return () => {
      if (this.submission) return this.submission;

      let resolveAttempt!: () => void;
      let rejectAttempt!: (reason: unknown) => void;
      const attempt = new Promise<void>((resolve, reject) => {
        resolveAttempt = resolve;
        rejectAttempt = reject;
      });
      this.submission = attempt;
      void this.runSubmission(onSuccess, onError).then(resolveAttempt, rejectAttempt);
      return attempt;
    };
  };

  private runSubmission = async (
    onSuccess: FormSubmitSuccessHandler<Values, Level>,
    onError?: FormSubmitErrorHandler<Values, Level>,
  ): Promise<void> => {
    const resetRevision = this.core.resetRevision;
    let successful = false;

    try {
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
      if (this.core.resetRevision !== resetRevision) return;

      const validation = this.core.startValidationRun(undefined, { type: 'submit' });
      const [valid] = await validation.result;
      if (!validation.isCurrent() || this.core.resetRevision !== resetRevision) return;

      const validationPassed = valid && this.core.valid();
      if (validationPassed) await onSuccess(validation.values, this);
      else await onError?.(this.core.currentIssues(), this);

      successful = validationPassed;
    } finally {
      this.submission = undefined;
      if (this.core.resetRevision === resetRevision) {
        this.core.persisted.setState(state => {
          return {
            ...state,
            status: {
              ...state.status,
              submits: state.status.submits + 1,
              submitting: false,
              successful,
            },
          };
        });
      }
    }
  };
}
